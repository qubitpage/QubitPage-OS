"""QubitPage® Quantum OS — User Authentication & Management Module.

Multi-user system with:
  - SQLite user database (users, groups, permissions, API keys)
  - Password hashing with bcrypt-style (hashlib pbkdf2)
  - Session-based authentication
  - Admin group with full control
  - Per-user API keys (Gemini, Groq) with connection testing
  - Per-user daily usage limits
  - Permission-based app access control
"""
from __future__ import annotations
import sqlite3
import hashlib
import secrets
import time
import json
import os
import logging
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional

logger = logging.getLogger("user_auth")

DB_PATH = Path(__file__).parent / "users.db"

# All available apps on the desktop
ALL_APPS = [
    "terminal", "circuit-lab", "quantum-game", "crypto-tools",
    "aria", "docs", "settings", "quantum-drug",
    "quantum-luck", "quantum-search",
]

# Default apps granted to new users (limited set)
DEFAULT_APPS = ["terminal", "docs", "settings", "quantum-game", "quantum-luck", "quantum-search"]

# Admin gets everything
ADMIN_APPS = ALL_APPS

# Daily usage limit for users without their own API keys
FREE_DAILY_LIMIT = 10

# ── Password Hashing ─────────────────────────────────────────

def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    """Hash password using PBKDF2-SHA256. Returns (hash_hex, salt_hex)."""
    if salt is None:
        salt = secrets.token_hex(32)
    h = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"),
                            bytes.fromhex(salt), iterations=600_000)
    return h.hex(), salt

def _verify_password(password: str, stored_hash: str, salt: str) -> bool:
    """Verify password against stored hash."""
    h, _ = _hash_password(password, salt)
    return secrets.compare_digest(h, stored_hash)


# ── Database Setup ────────────────────────────────────────────

def _get_db() -> sqlite3.Connection:
    """Get database connection with row factory."""
    conn = sqlite3.connect(str(DB_PATH), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn

def init_db():
    """Initialize database schema and create default admin account."""
    conn = _get_db()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL COLLATE NOCASE,
                email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                display_name TEXT NOT NULL DEFAULT '',
                user_group TEXT NOT NULL DEFAULT 'user',
                allowed_apps TEXT NOT NULL DEFAULT '[]',
                gemini_key TEXT DEFAULT '',
                groq_key TEXT DEFAULT '',
                ibm_token TEXT DEFAULT '',
                aws_access_key TEXT DEFAULT '',
                aws_secret_key TEXT DEFAULT '',
                daily_usage_count INTEGER DEFAULT 0,
                daily_usage_date TEXT DEFAULT '',
                total_usage INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at REAL NOT NULL,
                last_login REAL DEFAULT 0,
                settings TEXT DEFAULT '{}'
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at REAL NOT NULL,
                expires_at REAL NOT NULL,
                ip_address TEXT DEFAULT '',
                user_agent TEXT DEFAULT '',
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS backend_settings (
                backend_id TEXT PRIMARY KEY,
                enabled_for_users INTEGER DEFAULT 0,
                notes TEXT DEFAULT '',
                updated_at REAL NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        """);

        # Add new columns if missing (migration)
        try:
            conn.execute("SELECT aws_access_key FROM users LIMIT 1")
        except Exception:
            conn.execute("ALTER TABLE users ADD COLUMN aws_access_key TEXT DEFAULT ''")
            conn.execute("ALTER TABLE users ADD COLUMN aws_secret_key TEXT DEFAULT ''")

        # Create default admin if not exists
        existing = conn.execute("SELECT id FROM users WHERE username = ?", ("admin",)).fetchone()
        if not existing:
            pw_hash, pw_salt = _hash_password("QubitPage2026!")
            conn.execute("""
                INSERT INTO users (username, email, password_hash, password_salt,
                                   display_name, user_group, allowed_apps, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, ("admin", "admin@qubitpage.com", pw_hash, pw_salt,
                  "System Admin", "admin",
                  json.dumps(ADMIN_APPS), time.time()))
            logger.info("Default admin account created (admin / QubitPage2026!)")

        # Initialize backend_settings with defaults (free ones enabled)
        _init_default_backends(conn)

        conn.commit()
    finally:
        conn.close()

    logger.info("User database initialized at %s", DB_PATH)


def _init_default_backends(conn):
    """Insert default backend settings if not present."""
    from quantum_backends import MASTER_BACKENDS
    now = time.time()
    for bid, binfo in MASTER_BACKENDS.items():
        existing = conn.execute("SELECT backend_id FROM backend_settings WHERE backend_id = ?",
                                (bid,)).fetchone()
        if not existing:
            # Enable free backends by default
            enabled = 1 if binfo.get("pricing") in ("free", "free_tier") else 0
            conn.execute(
                "INSERT INTO backend_settings (backend_id, enabled_for_users, updated_at) VALUES (?, ?, ?)",
                (bid, enabled, now)
            )


# ── User Management ───────────────────────────────────────────

@dataclass
class UserProfile:
    id: int
    username: str
    email: str
    display_name: str
    user_group: str
    allowed_apps: list
    has_gemini_key: bool
    has_groq_key: bool
    has_ibm_token: bool
    daily_usage_count: int
    daily_limit: int
    total_usage: int
    is_active: bool
    created_at: float
    last_login: float

    def to_dict(self):
        return asdict(self)


def register_user(username: str, email: str, password: str,
                  display_name: str = "") -> dict:
    """Register a new user account."""
    # Validation
    if not username or len(username) < 3 or len(username) > 30:
        return {"success": False, "error": "Username must be 3-30 characters"}
    if not email or "@" not in email or len(email) > 100:
        return {"success": False, "error": "Valid email required"}
    if not password or len(password) < 6:
        return {"success": False, "error": "Password must be at least 6 characters"}

    # Sanitize username - alphanumeric + underscore only
    import re
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        return {"success": False, "error": "Username: letters, numbers, underscore only"}

    pw_hash, pw_salt = _hash_password(password)

    conn = _get_db()
    try:
        conn.execute("""
            INSERT INTO users (username, email, password_hash, password_salt,
                               display_name, user_group, allowed_apps, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (username, email, pw_hash, pw_salt,
              display_name or username, "user",
              json.dumps(DEFAULT_APPS), time.time()))
        conn.commit()
        user_id = conn.execute("SELECT id FROM users WHERE username = ?",
                               (username,)).fetchone()["id"]
        logger.info("New user registered: %s (id=%d)", username, user_id)
        return {"success": True, "user_id": user_id, "message": "Account created successfully"}
    except sqlite3.IntegrityError as e:
        if "username" in str(e).lower():
            return {"success": False, "error": "Username already taken"}
        elif "email" in str(e).lower():
            return {"success": False, "error": "Email already registered"}
        return {"success": False, "error": "Registration failed"}
    finally:
        conn.close()


def login_user(username: str, password: str,
               ip: str = "", user_agent: str = "") -> dict:
    """Authenticate user and create session."""
    conn = _get_db()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ? OR email = ?",
            (username, username)
        ).fetchone()

        if not row:
            return {"success": False, "error": "Invalid username or password"}

        if not row["is_active"]:
            return {"success": False, "error": "Account is disabled"}

        if not _verify_password(password, row["password_hash"], row["password_salt"]):
            return {"success": False, "error": "Invalid username or password"}

        # Create session token
        token = secrets.token_hex(32)
        now = time.time()
        expires = now + (30 * 24 * 3600)  # 30 days

        conn.execute("""
            INSERT INTO sessions (token, user_id, created_at, expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (token, row["id"], now, expires, ip, user_agent[:200] if user_agent else ""))

        # Update last login
        conn.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, row["id"]))

        # Clean expired sessions
        conn.execute("DELETE FROM sessions WHERE expires_at < ?", (now,))

        conn.commit()

        profile = _row_to_profile(row)
        logger.info("User logged in: %s", row["username"])
        return {
            "success": True,
            "token": token,
            "user": profile.to_dict(),
        }
    finally:
        conn.close()


def logout_user(token: str) -> dict:
    """Invalidate session token."""
    conn = _get_db()
    try:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        return {"success": True}
    finally:
        conn.close()


def get_user_by_token(token: str) -> Optional[dict]:
    """Get user data from session token. Returns None if invalid/expired."""
    if not token:
        return None
    conn = _get_db()
    try:
        row = conn.execute("""
            SELECT u.* FROM users u
            JOIN sessions s ON s.user_id = u.id
            WHERE s.token = ? AND s.expires_at > ? AND u.is_active = 1
        """, (token, time.time())).fetchone()

        if not row:
            return None
        return dict(row)
    finally:
        conn.close()


def get_user_profile(token: str) -> Optional[UserProfile]:
    """Get UserProfile from session token."""
    row_dict = get_user_by_token(token)
    if not row_dict:
        return None
    # Create a mock Row-like dict with key access
    return _dict_to_profile(row_dict)


def _row_to_profile(row) -> UserProfile:
    """Convert database row to UserProfile."""
    apps = json.loads(row["allowed_apps"]) if row["allowed_apps"] else DEFAULT_APPS
    daily_limit = FREE_DAILY_LIMIT
    if row["user_group"] == "admin":
        daily_limit = 999999
    elif row["gemini_key"] or row["groq_key"]:
        daily_limit = 999999  # unlimited with own keys

    return UserProfile(
        id=row["id"],
        username=row["username"],
        email=row["email"],
        display_name=row["display_name"],
        user_group=row["user_group"],
        allowed_apps=apps,
        has_gemini_key=bool(row["gemini_key"]),
        has_groq_key=bool(row["groq_key"]),
        has_ibm_token=bool(row["ibm_token"]),
        daily_usage_count=row["daily_usage_count"],
        daily_limit=daily_limit,
        total_usage=row["total_usage"],
        is_active=bool(row["is_active"]),
        created_at=row["created_at"],
        last_login=row["last_login"],
    )

def _dict_to_profile(d: dict) -> UserProfile:
    """Convert dict to UserProfile."""
    apps = json.loads(d["allowed_apps"]) if d.get("allowed_apps") else DEFAULT_APPS
    daily_limit = FREE_DAILY_LIMIT
    if d.get("user_group") == "admin":
        daily_limit = 999999
    elif d.get("gemini_key") or d.get("groq_key"):
        daily_limit = 999999

    return UserProfile(
        id=d["id"],
        username=d["username"],
        email=d["email"],
        display_name=d.get("display_name", ""),
        user_group=d.get("user_group", "user"),
        allowed_apps=apps,
        has_gemini_key=bool(d.get("gemini_key")),
        has_groq_key=bool(d.get("groq_key")),
        has_ibm_token=bool(d.get("ibm_token")),
        daily_usage_count=d.get("daily_usage_count", 0),
        daily_limit=daily_limit,
        total_usage=d.get("total_usage", 0),
        is_active=bool(d.get("is_active", 1)),
        created_at=d.get("created_at", 0),
        last_login=d.get("last_login", 0),
    )


# ── API Key Management ────────────────────────────────────────

def save_api_key(token: str, provider: str, api_key: str) -> dict:
    """Save an API key for the authenticated user."""
    user = get_user_by_token(token)
    if not user:
        return {"success": False, "error": "Not authenticated"}

    # Allow specific providers
    field_map = {
        "gemini": "gemini_key",
        "groq": "groq_key",
        "ibm": "ibm_token",
        "aws_access": "aws_access_key",
        "aws_secret": "aws_secret_key",
    }
    field = field_map.get(provider)
    if not field:
        return {"success": False, "error": f"Unknown provider: {provider}. Use: gemini, groq, ibm, aws_access, aws_secret"}

    conn = _get_db()
    try:
        conn.execute(f"UPDATE users SET {field} = ? WHERE id = ?",
                     (api_key, user["id"]))
        conn.commit()
        logger.info("API key saved for user %s: provider=%s", user["username"], provider)
        return {"success": True, "provider": provider, "message": f"{provider.title()} API key saved"}
    finally:
        conn.close()


def delete_api_key(token: str, provider: str) -> dict:
    """Remove an API key for the authenticated user."""
    user = get_user_by_token(token)
    if not user:
        return {"success": False, "error": "Not authenticated"}

    field_map = {"gemini": "gemini_key", "groq": "groq_key", "ibm": "ibm_token",
                 "aws_access": "aws_access_key", "aws_secret": "aws_secret_key"}
    field = field_map.get(provider)
    if not field:
        return {"success": False, "error": f"Unknown provider: {provider}"}

    conn = _get_db()
    try:
        conn.execute(f"UPDATE users SET {field} = '' WHERE id = ?", (user["id"],))
        conn.commit()
        return {"success": True, "provider": provider, "message": f"{provider.title()} API key removed"}
    finally:
        conn.close()


def get_user_api_keys(token: str) -> dict:
    """Get API key status (masked) for the authenticated user."""
    user = get_user_by_token(token)
    if not user:
        return {"success": False, "error": "Not authenticated"}

    def mask(key):
        if not key:
            return None
        if len(key) <= 8:
            return "****"
        return key[:4] + "•" * (len(key) - 8) + key[-4:]

    return {
        "success": True,
        "keys": {
            "gemini": {"set": bool(user.get("gemini_key")),
                       "masked": mask(user.get("gemini_key", ""))},
            "groq": {"set": bool(user.get("groq_key")),
                     "masked": mask(user.get("groq_key", ""))},
            "ibm": {"set": bool(user.get("ibm_token")),
                    "masked": mask(user.get("ibm_token", ""))},
            "aws_access": {"set": bool(user.get("aws_access_key")),
                           "masked": mask(user.get("aws_access_key", ""))},
            "aws_secret": {"set": bool(user.get("aws_secret_key")),
                           "masked": mask(user.get("aws_secret_key", ""))},
        },
    }


def test_api_key(provider: str, api_key: str) -> dict:
    """Test an API key by making a minimal request."""
    if not api_key:
        return {"success": False, "error": "No API key provided"}

    if provider == "gemini":
        try:
            import urllib.request
            url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
                   f"gemini-2.0-flash:generateContent?key={api_key}")
            payload = json.dumps({"contents": [{"parts": [{"text": "Say hello in one word"}]}],
                                  "generationConfig": {"maxOutputTokens": 10}})
            req = urllib.request.Request(url, data=payload.encode(),
                                        headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode())
            if result.get("candidates"):
                return {"success": True, "provider": "gemini",
                        "message": "Gemini API key is valid! Connection successful.",
                        "model": "gemini-2.0-flash"}
            return {"success": False, "error": "Unexpected response from Gemini"}
        except Exception as e:
            err = str(e)
            if "403" in err or "401" in err:
                return {"success": False, "error": "Invalid Gemini API key"}
            if "429" in err:
                return {"success": True, "provider": "gemini",
                        "message": "Gemini key valid (rate limited — try again shortly)"}
            return {"success": False, "error": f"Gemini test failed: {err[:100]}"}

    elif provider == "groq":
        try:
            import urllib.request
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = json.dumps({
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 5,
            })
            req = urllib.request.Request(url, data=payload.encode(), headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read().decode())
            if result.get("choices"):
                return {"success": True, "provider": "groq",
                        "message": "Groq API key is valid! Connection successful.",
                        "model": "llama-3.3-70b-versatile"}
            return {"success": False, "error": "Unexpected response from Groq"}
        except Exception as e:
            err = str(e)
            if "401" in err or "403" in err:
                return {"success": False, "error": "Invalid Groq API key"}
            if "429" in err:
                return {"success": True, "provider": "groq",
                        "message": "Groq key valid (rate limited — try again shortly)"}
            return {"success": False, "error": f"Groq test failed: {err[:100]}"}

    elif provider == "ibm":
        # Basic validation - IBM keys are typically 32+ chars
        if len(api_key) >= 20:
            return {"success": True, "provider": "ibm",
                    "message": "IBM Quantum token saved (format looks valid)"}
        return {"success": False, "error": "IBM token seems too short"}

    return {"success": False, "error": f"Unknown provider: {provider}"}


# ── Usage Tracking ────────────────────────────────────────────

def increment_usage(token: str) -> dict:
    """Increment daily usage counter. Returns remaining quota."""
    user = get_user_by_token(token)
    if not user:
        return {"allowed": False, "error": "Not authenticated"}

    today = time.strftime("%Y-%m-%d")
    conn = _get_db()
    try:
        # Reset daily count if new day
        if user.get("daily_usage_date") != today:
            conn.execute("UPDATE users SET daily_usage_count = 0, daily_usage_date = ? WHERE id = ?",
                         (today, user["id"]))
            user["daily_usage_count"] = 0

        profile = _dict_to_profile(user)
        current = user.get("daily_usage_count", 0)

        if current >= profile.daily_limit:
            return {
                "allowed": False,
                "error": "Daily limit reached. Add your own API keys in Settings for unlimited access.",
                "usage": current,
                "limit": profile.daily_limit,
            }

        conn.execute("""
            UPDATE users SET daily_usage_count = daily_usage_count + 1,
                             total_usage = total_usage + 1,
                             daily_usage_date = ?
            WHERE id = ?
        """, (today, user["id"]))
        conn.commit()

        return {
            "allowed": True,
            "usage": current + 1,
            "limit": profile.daily_limit,
            "remaining": profile.daily_limit - current - 1,
        }
    finally:
        conn.close()


def check_app_permission(token: str, app_name: str) -> bool:
    """Check if user has permission to use a specific app."""
    user = get_user_by_token(token)
    if not user:
        return False
    if user.get("user_group") == "admin":
        return True
    apps = json.loads(user.get("allowed_apps", "[]"))
    return app_name in apps


# ── Admin Functions ───────────────────────────────────────────

def admin_list_users(token: str) -> dict:
    """List all users (admin only)."""
    user = get_user_by_token(token)
    if not user or user.get("user_group") != "admin":
        return {"success": False, "error": "Admin access required"}

    conn = _get_db()
    try:
        rows = conn.execute("""
            SELECT id, username, email, display_name, user_group, allowed_apps,
                   daily_usage_count, total_usage, is_active, created_at, last_login,
                   CASE WHEN gemini_key != '' THEN 1 ELSE 0 END as has_gemini,
                   CASE WHEN groq_key != '' THEN 1 ELSE 0 END as has_groq
            FROM users ORDER BY id
        """).fetchall()

        users = []
        for r in rows:
            users.append({
                "id": r["id"],
                "username": r["username"],
                "email": r["email"],
                "display_name": r["display_name"],
                "group": r["user_group"],
                "allowed_apps": json.loads(r["allowed_apps"]),
                "daily_usage": r["daily_usage_count"],
                "total_usage": r["total_usage"],
                "is_active": bool(r["is_active"]),
                "has_gemini": bool(r["has_gemini"]),
                "has_groq": bool(r["has_groq"]),
                "created_at": r["created_at"],
                "last_login": r["last_login"],
            })

        return {"success": True, "users": users, "total": len(users)}
    finally:
        conn.close()


def admin_update_user(token: str, user_id: int, updates: dict) -> dict:
    """Update user settings (admin only)."""
    admin = get_user_by_token(token)
    if not admin or admin.get("user_group") != "admin":
        return {"success": False, "error": "Admin access required"}

    conn = _get_db()
    try:
        target = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not target:
            return {"success": False, "error": "User not found"}

        # Apply allowed updates
        if "allowed_apps" in updates:
            apps = updates["allowed_apps"]
            # Validate apps
            valid = [a for a in apps if a in ALL_APPS]
            conn.execute("UPDATE users SET allowed_apps = ? WHERE id = ?",
                         (json.dumps(valid), user_id))

        if "user_group" in updates:
            group = updates["user_group"]
            if group in ("admin", "user", "premium"):
                conn.execute("UPDATE users SET user_group = ? WHERE id = ?",
                             (group, user_id))
                if group == "admin":
                    conn.execute("UPDATE users SET allowed_apps = ? WHERE id = ?",
                                 (json.dumps(ADMIN_APPS), user_id))

        if "is_active" in updates:
            conn.execute("UPDATE users SET is_active = ? WHERE id = ?",
                         (1 if updates["is_active"] else 0, user_id))

        if "display_name" in updates:
            conn.execute("UPDATE users SET display_name = ? WHERE id = ?",
                         (str(updates["display_name"])[:50], user_id))

        conn.commit()
        logger.info("Admin %s updated user #%d", admin["username"], user_id)
        return {"success": True, "message": "User updated"}
    finally:
        conn.close()


def admin_delete_user(token: str, user_id: int) -> dict:
    """Delete a user account (admin only). Cannot delete admin."""
    admin = get_user_by_token(token)
    if not admin or admin.get("user_group") != "admin":
        return {"success": False, "error": "Admin access required"}

    if user_id == admin["id"]:
        return {"success": False, "error": "Cannot delete your own admin account"}

    conn = _get_db()
    try:
        target = conn.execute("SELECT username, user_group FROM users WHERE id = ?",
                              (user_id,)).fetchone()
        if not target:
            return {"success": False, "error": "User not found"}

        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
        logger.info("Admin %s deleted user #%d (%s)", admin["username"], user_id, target["username"])
        return {"success": True, "message": f"User '{target['username']}' deleted"}
    finally:
        conn.close()


# ── Backend Management (Admin) ────────────────────────────────

def get_enabled_backend_ids() -> list[str]:
    """Get list of backend IDs enabled for normal users."""
    conn = _get_db()
    try:
        rows = conn.execute(
            "SELECT backend_id FROM backend_settings WHERE enabled_for_users = 1"
        ).fetchall()
        return [r["backend_id"] for r in rows]
    finally:
        conn.close()


def admin_get_backend_settings(token: str) -> dict:
    """Get all backend settings (admin only)."""
    admin = get_user_by_token(token)
    if not admin or admin.get("user_group") != "admin":
        return {"success": False, "error": "Admin access required"}

    conn = _get_db()
    try:
        rows = conn.execute("SELECT * FROM backend_settings ORDER BY backend_id").fetchall()
        settings = {}
        for r in rows:
            settings[r["backend_id"]] = {
                "enabled_for_users": bool(r["enabled_for_users"]),
                "notes": r["notes"],
                "updated_at": r["updated_at"],
            }
        return {"success": True, "settings": settings}
    finally:
        conn.close()


def admin_set_backend_enabled(token: str, backend_id: str, enabled: bool) -> dict:
    """Enable or disable a single backend for normal users (admin only)."""
    admin = get_user_by_token(token)
    if not admin or admin.get("user_group") != "admin":
        return {"success": False, "error": "Admin access required"}

    conn = _get_db()
    try:
        existing = conn.execute("SELECT backend_id FROM backend_settings WHERE backend_id = ?",
                                (backend_id,)).fetchone()
        now = time.time()
        if existing:
            conn.execute("UPDATE backend_settings SET enabled_for_users = ?, updated_at = ? WHERE backend_id = ?",
                         (1 if enabled else 0, now, backend_id))
        else:
            conn.execute("INSERT INTO backend_settings (backend_id, enabled_for_users, updated_at) VALUES (?, ?, ?)",
                         (backend_id, 1 if enabled else 0, now))
        conn.commit()
        action = "enabled" if enabled else "disabled"
        logger.info("Admin %s %s backend %s for users", admin["username"], action, backend_id)
        return {"success": True, "backend_id": backend_id, "enabled": enabled,
                "message": f"Backend {backend_id} {action} for users"}
    finally:
        conn.close()


def admin_set_all_backends_enabled(token: str, enabled: bool) -> dict:
    """Enable or disable ALL backends for normal users (admin only)."""
    admin = get_user_by_token(token)
    if not admin or admin.get("user_group") != "admin":
        return {"success": False, "error": "Admin access required"}

    conn = _get_db()
    try:
        now = time.time()
        conn.execute("UPDATE backend_settings SET enabled_for_users = ?, updated_at = ?",
                     (1 if enabled else 0, now))
        conn.commit()
        action = "enabled" if enabled else "disabled"
        logger.info("Admin %s %s ALL backends for users", admin["username"], action)
        return {"success": True, "enabled": enabled,
                "message": f"All backends {action} for users"}
    finally:
        conn.close()
