import os
import uuid
import io
import json
import re
import functools
import threading
import time
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import pandas as pd
import boto3
from botocore.exceptions import ClientError
import logging
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import urllib.parse

# === CONFIGURATION ===
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- SECRET KEY: warn loudly if not set in environment ---
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    logger.critical("SECURITY WARNING: SECRET_KEY environment variable is not set! "
                    "Using a temporary key — sessions will not persist across restarts. "
                    "Set SECRET_KEY in your Render environment variables immediately.")
    import secrets
    SECRET_KEY = secrets.token_hex(32)
app.secret_key = SECRET_KEY

AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_DEFAULT_REGION = os.environ.get('AWS_DEFAULT_REGION')
AWS_S3_BUCKET = os.environ.get('AWS_S3_BUCKET', 'alx-peerfinder-storage-bucket')

s3 = boto3.client('s3', aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY, region_name=AWS_DEFAULT_REGION)

# === MASTER FILE NAMES (ALL VERTICALS SHARE THESE NOW) ===
CSV_OBJECT_KEY = 'fit-master-peerfinder.csv'
FEEDBACK_OBJECT_KEY = 'fit-master-feedback.csv'
SESSION_FEEDBACK_OBJECT_KEY = 'fit-master-session_feedback.csv'
NO_SHOW_OBJECT_KEY = 'fit-master-no_show.csv'
UNPAIR_REASONS_KEY = 'fit-master-unpair_reasons.csv'

ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')

def load_google_token(env_var_name):
    token_str = os.environ.get(env_var_name)
    if not token_str: return None
    try: return json.loads(token_str)
    except json.JSONDecodeError: return None

# === MASTER PROGRAM CREDENTIALS (CA + CT) ===
# === FIT — single program for now: 'AIFW' code maps to "AI Fluency for the Workplace" ===
# NOTE: uses AIFW_EMAIL / AIFW_GOOGLE_TOKEN env vars on the FIT Render service. These currently
# point at the same underlying foundations@alxafrica.com Gmail credential as ALX's 'PF' program,
# but 'AIFW' is a distinct program code so this is fully decoupled from ALX going forward.
PROGRAM_CREDENTIALS = {
    'AIFW': { 'email': os.environ.get('AIFW_EMAIL', 'foundations@alxafrica.com'), 'token': load_google_token('AIFW_GOOGLE_TOKEN') }
}
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

# === SIMPLE IN-MEMORY RATE LIMITING FOR /api/register ===
_rate_limit_store = {}
RATE_LIMIT_WINDOW = 3600  # 1 hour
RATE_LIMIT_MAX = 15       # 15 registrations per IP per hour

def check_rate_limit(ip):
    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW
    timestamps = _rate_limit_store.get(ip, [])
    timestamps = [t for t in timestamps if t > window_start]
    if len(timestamps) >= RATE_LIMIT_MAX:
        _rate_limit_store[ip] = timestamps
        return False
    timestamps.append(now)
    _rate_limit_store[ip] = timestamps
    return True

def validate_registration(data):
    errors = []
    if not data.get('name') or len(data['name'].strip()) < 2 or len(data['name']) > 100: errors.append("Name must be between 2 and 100 characters")
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data.get('email', '')): errors.append("Invalid email address format")
    if not re.match(r'^\+?[1-9]\d{1,14}$', data.get('phone', '').replace(' ', '')): errors.append("Invalid phone number")

    # FIT currently offers a single program. Add new codes to this list as more programs launch
    # (keep PROGRAM_CREDENTIALS in sync with any new codes added here).
    if data.get('program') not in ['AIFW']: errors.append("Invalid program selected")

    if data.get('connection_type') not in ['find', 'offer', 'need', 'group']: errors.append("Invalid connection type")
    if data.get('connection_type') == 'offer' and not data.get('pseudonym'):
         errors.append("A pseudonym is required for volunteers")
    return errors

# FIX #10: Use functools.wraps so Flask can correctly name each endpoint function
def api_wrapper(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try: return f(*args, **kwargs)
        except ClientError: return jsonify({"success": False, "error": "Database connection failed (S3)"}), 503
        except pd.errors.EmptyDataError: return jsonify({"success": False, "error": "Data file is empty or corrupted"}), 500
        except Exception as e: return jsonify({"success": False, "error": f"Server Error: {str(e)}"}), 500
    return wrapper

def get_gmail_service(program_name):
    # Fallback to AIFW (AI Fluency for the Workplace) if something goes wrong — it's the only program credential configured for FIT
    if not program_name or program_name not in PROGRAM_CREDENTIALS: program_name = 'AIFW'
    config = PROGRAM_CREDENTIALS[program_name]
    try:
        creds = Credentials.from_authorized_user_info(config['token'], SCOPES)
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token: creds.refresh(Request())
        return build('gmail', 'v1', credentials=creds), config['email']
    except Exception: return None, None

def send_email(to, subject, body, program_name, is_html=True):
    try:
        service, sender_email = get_gmail_service(program_name)
        if not service: return False
        message = MIMEMultipart('alternative')
        message['to'] = to
        message['from'] = sender_email
        message['subject'] = subject

        html_body = f"""
        <html><body style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <div style="background-color: #091F40; padding: 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">FIT PeerFinder — Global Skills Academy</h1>
            </div>
            <div style="padding: 30px; color: #333333; font-size: 16px; line-height: 1.6;">{body}</div>
        </div></body></html>"""

        if is_html: message.attach(MIMEText(html_body, 'html'))
        else: message.attach(MIMEText(body, 'plain'))
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service.users().messages().send(userId='me', body={'raw': raw}).execute()
        return True
    except Exception: return False

def notify_group_match(df, group_id, new_member_id=None):
    """
    Sends match notification emails to all members in a group.
    - new_member_id: if set, this person just joined an EXISTING group.
      Existing members get a brief "new member added" update.
      The new member gets the full welcome email.
    - Incomplete groups (group_size target not yet reached) show a forming banner.
    """
    grp = df[df['group_id'] == group_id]
    if grp.empty: return

    video_link = f"https://meet.jit.si/ALX-PeerFinder-{group_id}"
    current_size = len(grp)

    # Determine target group size (only meaningful for find/group connection types)
    first_member = grp.iloc[0]
    conn_types = grp['connection_type'].unique().tolist()
    is_peer_group = any(ct in ['find', 'group'] for ct in conn_types)
    try:
        gs = str(first_member.get('group_size', '2')).replace('.0', '').strip()
        target_size = int(gs) if gs and gs.isdigit() else 2
    except Exception:
        target_size = 2
    is_forming = is_peer_group and (current_size < target_size)

    for _, current_user in grp.iterrows():
        is_existing_member = (new_member_id is not None and str(current_user['id']) != str(new_member_id))

        # Build peer info HTML (WhatsApp only — Telegram removed due to spam reports)
        peer_info_html = ""
        for _, peer in grp.iterrows():
            if peer['id'] != current_user['id']:
                clean_phone = re.sub(r'\D', '', str(peer['phone']))
                wa_link = f"https://wa.me/{clean_phone}"
                meet_pref = str(peer.get('meeting_preference', 'All'))
                role_label = "Volunteer" if peer['connection_type'] == 'offer' else "Peer" if peer['connection_type'] == 'need' else "Study Buddy"
                display_name = peer['name']

                peer_info_html += f"""
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e0e0e0;">
                    <strong style="font-size: 18px; color: #091F40;">{display_name}</strong><br/>
                    <span style="color: #555;">📧 {peer['email']}</span><br/>
                    <span style="color: #555;">🎯 Role: <strong>{role_label}</strong></span><br/>
                    <span style="color: #555;">📌 Prefers to meet via: <strong>{meet_pref}</strong></span><br/>
                    <div style="margin-top: 15px;">
                        <a href="{wa_link}" style="background-color: #25D366; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">WhatsApp</a>
                    </div>
                </div>"""

        # --- Existing member: send a brief "new person joined" update ---
        if is_existing_member:
            new_member_row = grp[grp['id'] == new_member_id]
            if new_member_row.empty:
                continue
            nm = new_member_row.iloc[0]
            nm_phone = re.sub(r'\D', '', str(nm['phone']))
            nm_wa = f"https://wa.me/{nm_phone}"
            forming_note = (
                f'<p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px; border: 1px solid #ffeeba;">'
                f'⏳ Your group is still forming — currently <strong>{current_size} of {target_size}</strong> members. More peers will be added!</p>'
                if is_forming else
                f'<p style="color: #155724; background: #d4edda; padding: 10px; border-radius: 5px; border: 1px solid #c3e6cb;">✅ Your group is now complete! Happy collaborating!</p>'
            )
            body = f"""
            <h2 style="color: #091F40; margin-top: 0;">🔔 New Member Joined Your Group!</h2>
            Hi <strong>{current_user['name']}</strong>,<br/><br/>
            <strong>{nm['name']}</strong> has just joined your peer group for <strong>{current_user.get('course', '')}</strong>!<br/><br/>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #e0e0e0;">
                <strong style="color: #091F40;">{nm['name']}</strong><br/>
                <span style="color: #555;">📧 {nm['email']}</span><br/>
                <div style="margin-top: 10px;">
                    <a href="{nm_wa}" style="background-color: #25D366; color: white; padding: 8px 12px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">WhatsApp</a>
                </div>
            </div>
            {forming_note}
            <br/>Best regards,<br/><strong>Peer Finder Team</strong>"""
            try: send_email(current_user['email'], "New member joined your group! 🎉", body, current_user['program'], is_html=True)
            except Exception: pass
            continue

        # --- New member (or initial group formation): send full welcome email ---
        is_volunteer = current_user['connection_type'] == 'offer'
        is_needer = current_user['connection_type'] == 'need'

        if is_volunteer:
            cap = int(float(current_user.get('volunteer_capacity', 3))) if pd.notna(current_user.get('volunteer_capacity')) and current_user.get('volunteer_capacity') not in ['', 'None'] else 3
            current_needers = len(grp[grp['connection_type'] == 'need'])
            remaining = cap - current_needers
            custom_msg = f"Thanks so much, <strong>{current_user['name']}</strong>, for stepping up to support your peers in need. You are a true champion and we will not forget you for this!<br/><br/>"
            if remaining > 0:
                custom_msg += f"You requested to support {cap} peers, and you have currently been matched with {current_needers}. Over time, {remaining} more peer(s) will be added to your group as they register and search for help."
            else:
                custom_msg += f"Your group is now fully matched with all {cap} peers you requested to support!"
        elif is_needer:
            custom_msg = f"Hi <strong>{current_user['name']}</strong>,<br/><br/>Great news! You have been successfully paired with a Volunteer who is ready to support you (and potentially other peers)."
        elif is_forming:
            custom_msg = (
                f"Hi <strong>{current_user['name']}</strong>,<br/><br/>"
                f"Your group is forming! You have been matched with <strong>{current_size - 1}</strong> peer(s) so far "
                f"(target: <strong>{target_size}</strong> members). You will be notified as more members join — "
                f"start connecting now while we fill the rest of your group!"
            )
        else:
            custom_msg = f"Hi <strong>{current_user['name']}</strong>,<br/><br/>You have been successfully matched! Here is the information for your peer(s):"

        forming_banner = ""
        if is_forming:
            forming_banner = f"""
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; margin-bottom: 15px;">
                <strong style="color: #856404;">🔄 Group Status: Forming ({current_size} of {target_size} members)</strong><br/>
                <span style="color: #856404;">More peers will be added as they register. We'll email you each time someone joins!</span>
            </div>"""

        body = f"""
        <h2 style="color: #091F40; margin-top: 0;">It's a Match! 🎉</h2>
        {custom_msg}<br/><br/>
        {forming_banner}
        {peer_info_html}
        <br/>
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border: 1px solid #b8daff; text-align: center;">
            <h3 style="margin-top: 0; color: #0056b3;">🎥 Your Dedicated Group Video Room</h3>
            <p style="margin-bottom: 10px; color: #004085;">We have generated a free, instant video meeting room for your group. No account required!</p>
            <a href="{video_link}" style="background-color: #0056b3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; display: inline-block;">Join Video Call Now</a>
        </div>
        <br/><br/>
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffeeba; font-size: 14px;">
            <strong style="color: #856404; font-size: 16px;">⚠️ Please Read Carefully</strong><br/><br/>
            <ul style="margin-bottom: 0; padding-left: 20px; color: #856404;">
                <li>Please show up for your partner or group — ghosting is discouraged and can affect their progress.</li>
                <li>If you no longer wish to participate, let your partner/group know first before unpairing.</li>
            </ul>
        </div><br/>Best regards,<br/><strong>Peer Finder Team</strong>"""
        try: send_email(current_user['email'], "You've been matched! 🎉", body, current_user['program'], is_html=True)
        except Exception: pass

REQUIRED_COLUMNS = [
    'id', 'name', 'phone', 'email', 'country', 'language', 'program', 'course', 'learning_preferences', 'availability',
    'match_preference', 'connection_type', 'timestamp', 'matched', 'group_id', 'unpair_reason', 'matched_timestamp',
    'match_attempted', 'volunteer_capacity', 'meeting_preference', 'timezone', 'group_size', 'pseudonym', 'current_load'
]

def clean_boolean(val):
    if pd.isna(val): return False
    return str(val).strip().upper() in ['TRUE', '1', 'YES', 'T']

def download_csv(key=CSV_OBJECT_KEY):
    try:
        obj = s3.get_object(Bucket=AWS_S3_BUCKET, Key=key)
        df = pd.read_csv(io.StringIO(obj['Body'].read().decode('utf-8')))
        if key == CSV_OBJECT_KEY:
            for col in REQUIRED_COLUMNS:
                if col not in df.columns:
                    df[col] = False if col in ['matched', 'match_attempted'] else 0 if col == 'current_load' else ''

            str_cols = ['id', 'name', 'phone', 'email', 'country', 'program', 'course', 'availability', 'connection_type', 'group_id', 'match_preference', 'learning_preferences', 'unpair_reason', 'timestamp', 'matched_timestamp', 'timezone', 'meeting_preference', 'volunteer_capacity', 'group_size', 'pseudonym']
            for c in str_cols:
                if c in df.columns: df[c] = df[c].astype(str).str.replace(r'\.0$', '', regex=True).str.replace(r'\s+', ' ', regex=True).str.strip().replace('nan', '')

            if 'matched' in df.columns: df['matched'] = df['matched'].apply(clean_boolean)
            if 'match_attempted' in df.columns: df['match_attempted'] = df['match_attempted'].apply(clean_boolean)
            if 'email' in df.columns: df['email'] = df['email'].str.lower()
        return df
    except ClientError:
        if key == CSV_OBJECT_KEY:
            return pd.DataFrame(columns=REQUIRED_COLUMNS)
        elif key == FEEDBACK_OBJECT_KEY:
            return pd.DataFrame(columns=['id', 'rating', 'comment', 'timestamp'])
        elif key == SESSION_FEEDBACK_OBJECT_KEY:
             return pd.DataFrame(columns=['id', 'timestamp', 'email', 'program', 'course', 'role', 'volunteer_email', 'session_happened', 'ghoster_emails', 'rematch_request', 'overall_rating', 'progress', 'feedback_details'])
        elif key == UNPAIR_REASONS_KEY:
             return pd.DataFrame(columns=['timestamp', 'user_id', 'email', 'program', 'course', 'reason', 'ghoster_email'])
        elif key == NO_SHOW_OBJECT_KEY:
             return pd.DataFrame(columns=['timestamp', 'reporter', 'ghoster'])
        return pd.DataFrame()

def upload_csv(df, key=CSV_OBJECT_KEY):
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    s3.put_object(Bucket=AWS_S3_BUCKET, Key=key, Body=csv_buffer.getvalue(), ContentType='text/csv')

def normalize_str(val):
    if pd.isna(val) or val is None: return ""
    return re.sub(r'\s+', ' ', str(val)).strip().lower()

def availability_match(a1, a2):
    a1_clean = normalize_str(a1)
    a2_clean = normalize_str(a2)
    if not a1_clean or not a2_clean: return False
    return (a1_clean == 'flexible' or a2_clean == 'flexible' or a1_clean == a2_clean)

def parse_tz_offset(tz_str):
    if not tz_str or pd.isna(tz_str): return 0
    tz_str = str(tz_str).upper()
    if 'WAT' in tz_str: return 1
    if 'CAT' in tz_str: return 2
    if 'EAT' in tz_str: return 3
    if 'GMT' in tz_str and '+' not in tz_str and '-' not in tz_str: return 0
    match = re.search(r'UTC([+-]\d+)', tz_str)
    if match: return int(match.group(1))
    return 0

def check_compatibility(user_a, peer_b):
    """
    Returns True if BOTH users' match preferences are mutually satisfied.

    Preference hierarchy (each includes all levels below it):
      Country  ⊂  Timezone  ⊂  Buffer  ⊂  Global

    Examples:
    - Chuks(Kenya, Country) + Claude(Kenya, Global) → True  ✓
    - Chuks(Ghana, Buffer)  + Claude(Ghana, Global) → True  ✓
    - Chuks(Egypt, Country) + Me(Egypt, Buffer)     → True  ✓
    - Chuks(Kenya, Country) + Claude(Ghana, Global) → False ✓ (Chuks only wants Kenya)
    """
    pref_a = normalize_str(user_a.get('match_preference', 'global'))
    pref_b = normalize_str(peer_b.get('match_preference', 'global'))

    country_a = normalize_str(user_a.get('country', ''))
    country_b = normalize_str(peer_b.get('country', ''))
    same_country = (country_a == country_b and country_a not in ['', 'nan'])

    tz_a = parse_tz_offset(user_a.get('timezone', ''))
    tz_b = parse_tz_offset(peer_b.get('timezone', ''))
    same_tz = (tz_a == tz_b)
    within_buffer = (abs(tz_a - tz_b) <= 2)

    def is_satisfied(pref):
        if pref == 'country':  return same_country
        if pref == 'timezone': return same_country or same_tz
        if pref == 'buffer':   return same_country or same_tz or within_buffer
        return True  # 'global' accepts anyone; also the safe fallback

    return is_satisfied(pref_a) and is_satisfied(pref_b)

def get_course_num(course_str):
    try:
        match = re.search(r'-(\d+)', str(course_str))
        return int(match.group(1)) if match else 0
    except: return 0

# === THE SMART MATCHING ENGINE ===
def perform_matching(df, user_id):
    """
    Returns (df, updated, gid, joined_existing).
    - joined_existing: True if the user was added to a pre-existing group (not a new formation).
    
    Improvements over previous version:
    1. Mutual preference compatibility (check_compatibility) — Global now works with anyone.
    2. Gradual group matching — groups of 3/5 form as soon as 2 compatible peers are found,
       then more members are added as they register.
    3. For 'find'/'group': first tries to join an existing incomplete group before starting a new one.
    """
    user_rows = df[df['id'] == user_id]
    if user_rows.empty: return df, False, None, False

    idx = user_rows.index[0]
    user = user_rows.iloc[0]
    df.at[idx, 'match_attempted'] = True

    if bool(user['matched']): return df, False, None, False

    updated = False
    joined_existing = False
    gid = f"group-{uuid.uuid4()}"
    iso = datetime.now(timezone.utc).isoformat()

    u_program = normalize_str(user['program'])
    u_course = normalize_str(user['course'])

    program_pool = df[
        (df['matched'] == False) &
        (df['program'].apply(normalize_str) == u_program) &
        (df['course'].apply(normalize_str) == u_course) &
        (df['id'] != user_id)
    ]

    if user['connection_type'] in ['find', 'group']:
        size_str = str(user['group_size']).replace('.0', '').strip() if pd.notna(user.get('group_size')) and user.get('group_size') else '2'
        if not size_str or not size_str.isdigit(): size_str = '2'
        target_size = int(size_str)

        # --- STEP 1: Try to join an existing INCOMPLETE group ---
        # Look for matched groups with the same program/course/size that still have room
        existing_members_df = df[
            (df['matched'] == True) &
            (df['program'].apply(normalize_str) == u_program) &
            (df['course'].apply(normalize_str) == u_course) &
            (df['connection_type'].isin(['find', 'group'])) &
            (df['group_size'].astype(str).str.replace('.0', '', regex=False).str.strip() == size_str) &
            (df['group_id'].astype(str).str.strip() != '') &
            (df['id'] != user_id)
        ]

        for existing_gid, grp_members in existing_members_df.groupby('group_id'):
            if len(grp_members) >= target_size:
                continue  # This group is already full
            # User must be compatible with every existing member in the group
            if all(check_compatibility(user.to_dict(), row.to_dict()) for _, row in grp_members.iterrows()):
                df.at[idx, 'matched'] = True
                df.at[idx, 'group_id'] = existing_gid
                df.at[idx, 'matched_timestamp'] = iso
                df.at[idx, 'unpair_reason'] = ''
                gid = existing_gid
                updated = True
                joined_existing = True
                break

        if not updated:
            # --- STEP 2: Start a NEW group with compatible peers (gradual — even 1 peer is enough) ---
            base_pool = program_pool[
                program_pool['connection_type'].isin(['find', 'group']) &
                program_pool['group_size'].astype(str).str.replace('.0', '', regex=False).str.strip().eq(size_str)
            ].copy()

            compatible_indices = [
                pool_idx for pool_idx, p_user in base_pool.iterrows()
                if check_compatibility(user.to_dict(), p_user.to_dict())
            ]

            if compatible_indices:
                # Form the group now with whoever is compatible (up to target_size - 1)
                peers_to_add = compatible_indices[:target_size - 1]
                all_idx = [idx] + peers_to_add
                df.loc[all_idx, 'matched'] = True
                df.loc[all_idx, 'group_id'] = gid
                df.loc[all_idx, 'matched_timestamp'] = iso
                df.loc[all_idx, 'unpair_reason'] = ''
                updated = True

    elif user['connection_type'] == 'offer':
        capacity = int(float(user.get('volunteer_capacity', 3))) if pd.notna(user.get('volunteer_capacity')) and user.get('volunteer_capacity') not in ['', 'None'] else 3
        pool = program_pool[program_pool['connection_type'] == 'need'].copy()

        if not pool.empty:
            matched_peers = pool.head(capacity)
            all_idx = [idx] + matched_peers.index.tolist()
            df.loc[all_idx, 'matched'] = True
            df.loc[all_idx, 'group_id'] = gid
            df.loc[all_idx, 'matched_timestamp'] = iso
            df.loc[all_idx, 'unpair_reason'] = ''
            df.at[idx, 'current_load'] = len(matched_peers)
            updated = True

    elif user['connection_type'] == 'need':
        course_num = get_course_num(user['course'])
        active_vols = df[
            (df['connection_type'] == 'offer') &
            (df['program'].apply(normalize_str) == u_program) &
            (df['matched'] == True)
        ]

        for v_idx, vol in active_vols.iterrows():
            v_cap = int(float(vol.get('volunteer_capacity', 3))) if pd.notna(vol.get('volunteer_capacity')) and vol.get('volunteer_capacity') not in ['', 'None'] else 3
            v_group_id = vol['group_id']
            if not v_group_id: continue

            if get_course_num(vol['course']) >= course_num:
                current_needers = len(df[(df['group_id'] == v_group_id) & (df['connection_type'] == 'need')])
                if current_needers < v_cap:
                    df.at[idx, 'matched'] = True
                    df.at[idx, 'group_id'] = v_group_id
                    df.at[idx, 'matched_timestamp'] = iso
                    df.at[idx, 'unpair_reason'] = ''
                    df.at[v_idx, 'current_load'] = current_needers + 1
                    updated = True
                    gid = v_group_id
                    joined_existing = True
                    break

        if not updated:
            unmatched_vols = df[
                (df['matched'] == False) &
                (df['connection_type'] == 'offer') &
                (df['program'].apply(normalize_str) == u_program) &
                (df['id'] != user_id)
            ]

            for v_idx, vol in unmatched_vols.iterrows():
                if get_course_num(vol['course']) >= course_num:
                    v_cap = int(float(vol.get('volunteer_capacity', 3))) if pd.notna(vol.get('volunteer_capacity')) and vol.get('volunteer_capacity') not in ['', 'None'] else 3

                    other_needers = program_pool[(program_pool['connection_type'] == 'need') & (program_pool['id'] != user_id)].copy()
                    matched_other_needers = other_needers.head(v_cap - 1)

                    all_idx = [idx, v_idx] + matched_other_needers.index.tolist()
                    df.loc[all_idx, 'matched'] = True
                    df.loc[all_idx, 'group_id'] = gid
                    df.loc[all_idx, 'matched_timestamp'] = iso
                    df.loc[all_idx, 'unpair_reason'] = ''
                    df.at[v_idx, 'current_load'] = len(matched_other_needers) + 1
                    updated = True
                    break

    return df, updated, gid, joined_existing

# === ROUTES ===

@app.route('/', methods=['GET'])
@api_wrapper
def health(): return jsonify({"status": "active", "version": "FIT_PeerFinder_v1", "deployment": "Frontier Institute of Technology"})

@app.route('/api/register', methods=['POST'])
@api_wrapper
def register():
    # FIX #7: Simple rate limiting to prevent spam registrations
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr or 'unknown').split(',')[0].strip()
    if not check_rate_limit(client_ip):
        return jsonify({"success": False, "error": "Too many registration attempts. Please try again later."}), 429

    data = request.get_json()
    errors = validate_registration(data)
    if errors: return jsonify({"success": False, "error": "; ".join(errors)}), 400

    email = data['email'].strip().lower()
    phone = data['phone'].strip()
    if not phone.startswith('+'): phone = '+' + phone.lstrip('+')

    df = download_csv()
    capacity_val = data.get('volunteer_capacity', '3') if data['connection_type'] == 'offer' else '0'

    existing_mask = ((df['email'] == email) | (df['phone'] == phone)) & (df['connection_type'] == data['connection_type']) & (df['course'] == data['course'])
    if not df[existing_mask].empty:
        idx = existing_mask.idxmax()
        existing = df.loc[idx]
        return jsonify({"success": False, "is_duplicate": True, "user_id": str(existing['id']), "already_matched": bool(existing['matched'])})

    new_id = str(uuid.uuid4())
    new_user = {
        'id': new_id, 'name': data['name'], 'email': email, 'phone': phone,
        'program': data['program'], 'course': data['course'], 'country': data.get('country', ''),
        'language': data.get('language', ''), 'learning_preferences': data.get('learning_preferences', ''),
        'availability': data.get('availability', ''),
        'group_size': data.get('group_size', '2'),
        'connection_type': data['connection_type'], 'match_preference': data.get('match_preference', 'Global'),
        'timestamp': datetime.now(timezone.utc).isoformat(), 'matched': False, 'group_id': '', 'unpair_reason': '',
        'matched_timestamp': '', 'match_attempted': False, 'volunteer_capacity': capacity_val,
        'current_load': 0, 'meeting_preference': data.get('meeting_preference', 'All'), 'timezone': data.get('timezone', ''),
        'pseudonym': data.get('pseudonym', '')
    }

    target_volunteer_id = data.get('target_volunteer_id')
    if target_volunteer_id:
         vol_idx = df.index[df['id'] == target_volunteer_id].tolist()
         if vol_idx:
             v_i = vol_idx[0]
             if int(df.at[v_i, 'current_load'] or 0) < int(df.at[v_i, 'volunteer_capacity'] or 3):
                  group_id = df.at[v_i, 'group_id']
                  if not group_id or pd.isna(group_id):
                       group_id = str(uuid.uuid4())
                       df.at[v_i, 'group_id'] = group_id
                       df.at[v_i, 'matched'] = True
                       df.at[v_i, 'matched_timestamp'] = datetime.now(timezone.utc).isoformat()

                  new_user['matched'] = True
                  new_user['group_id'] = group_id
                  new_user['matched_timestamp'] = datetime.now(timezone.utc).isoformat()
                  df.at[v_i, 'current_load'] = int(df.at[v_i, 'current_load'] or 0) + 1

                  df = pd.concat([df, pd.DataFrame([new_user])], ignore_index=True)
                  upload_csv(df)
                  notify_group_match(df, group_id)
                  return jsonify({"success": True, "user_id": new_id})

    df = pd.concat([df, pd.DataFrame([new_user])], ignore_index=True)
    # NOTE: perform_matching now returns a 4-tuple
    df, updated, gid, joined_existing = perform_matching(df, new_id)
    upload_csv(df)

    if updated:
        if joined_existing:
            # User joined a pre-existing group: notify existing members + welcome the new user
            notify_group_match(df, gid, new_member_id=new_id)
        else:
            # New group formed (may be incomplete for groups of 3/5 — banner handled inside)
            notify_group_match(df, gid)
    else:
        wait_body = f"""<h2 style="color: #091F40; margin-top: 0;">You're in Queue! ⏳</h2>
        Hi <strong>{data['name']}</strong>,<br/><br/>Your request is currently in the queue.<br/>
        As soon as a suitable peer or group is available, you'll be matched and notified via email.<br/><br/>
        You can check your status anytime on the PeerFinder app using your Email Address.<br/>
        Best regards,<br/><strong>Peer Finder Team</strong>"""
        send_email(email, "PeerFinder - Waiting to Be Matched ⏳", wait_body, data['program'], is_html=True)

    return jsonify({"success": True, "user_id": new_id})

# --- FIXED MARKETPLACE LOGIC ---
@app.route('/api/marketplace', methods=['GET'])
@api_wrapper
def marketplace():
    program = request.args.get('program')
    course = request.args.get('course')
    course_num = get_course_num(course)

    df = download_csv()
    df_offers = df[(df['connection_type'] == 'offer') & (df['program'] == program)].copy()

    if df_offers.empty:
        return jsonify({'success': True, 'volunteers': []})

    df_offers['course_level'] = df_offers['course'].apply(get_course_num)
    df_valid = df_offers[df_offers['course_level'] >= course_num].copy()

    df_valid['v_cap'] = pd.to_numeric(df_valid['volunteer_capacity'], errors='coerce').fillna(3)
    df_valid['curr_l'] = pd.to_numeric(df_valid['current_load'], errors='coerce').fillna(0)

    df_final = df_valid[df_valid['curr_l'] < df_valid['v_cap']].copy()

    volunteers = []
    for _, row in df_final.iterrows():
        v_name = str(row.get('pseudonym', '')).strip()
        if not v_name or v_name == 'nan':
            v_name = f"Volunteer {str(row['id'])[:4]}"

        volunteers.append({
            'id': str(row['id']),
            'name': v_name,
            'country': str(row.get('country', 'Global')),
            'timezone': str(row.get('timezone', 'UTC')),
            'availability': str(row.get('availability', 'Flexible')),
            'language': str(row.get('language', 'English')),
            'course': str(row.get('course', '')),
            'capacity': int(row['v_cap']),
            'current_load': int(row['curr_l'])
        })

    return jsonify({'success': True, 'volunteers': volunteers})

@app.route('/api/status/<identifier>', methods=['GET'])
@api_wrapper
def status(identifier):
    df = download_csv()
    ident_lower = identifier.strip().lower()

    user_requests = df[(df['id'] == identifier.strip()) | (df['email'].str.lower() == ident_lower)].sort_values(by='timestamp', ascending=False)
    if user_requests.empty: return jsonify({"error": "Not found"}), 404

    res_list = []
    for _, u in user_requests.iterrows():
        res = {
            "matched": bool(u['matched']),
            "user": {
                "name": u['name'], "program": u.get('program', ''), "course": u['course'],
                "connection_type": str(u.get('connection_type', '')),
                "volunteer_capacity": str(u.get('volunteer_capacity', ''))
            },
            "real_id": str(u['id'])
        }

        if bool(u['matched']) and u['group_id']:
            grp = df[df['group_id'] == u['group_id']]
            # FIX #1: Include group_id so the frontend can build the correct Jitsi room URL
            res['group_id'] = str(u['group_id'])
            res['group'] = grp[['name', 'email', 'phone', 'connection_type', 'meeting_preference']].fillna("").to_dict('records')
        res_list.append(res)

    return jsonify(res_list)

@app.route('/api/admin/auto-match-queue', methods=['POST'])
@api_wrapper
def auto_match_queue():
    data = request.get_json()
    if data.get('password') != ADMIN_PASSWORD: return jsonify({"error": "Unauthorized"}), 401

    df = download_csv()
    unmatched = df[df['matched'] == False]

    if unmatched.empty:
        return jsonify({"success": True, "message": "Queue is clear — no unmatched learners found."})

    total_before = len(unmatched)
    groups_formed = []

    for uid in unmatched['id'].tolist():
        try:
            current_check = df[df['id'] == uid]
            if not current_check.empty and bool(current_check.iloc[0]['matched']): continue
            # FIX C: wrapped in try/except — one bad row no longer aborts the entire queue
            df, updated, gid, _ = perform_matching(df, uid)
            if updated: groups_formed.append(gid)
        except Exception as e:
            logger.error(f"Auto-match skipped user {uid}: {e}")
            continue

    upload_csv(df)
    unique_groups = set(groups_formed)
    pending_after = len(df[df['matched'] == False])

    # FIX: Send emails in a background thread so the HTTP response returns immediately
    # (avoids Render's 30-second request timeout when many groups are formed)
    if unique_groups:
        snapshot_df = df.copy()
        def send_emails_background():
            for gid in unique_groups:
                try:
                    notify_group_match(snapshot_df, gid)
                except Exception as e:
                    logger.error(f"Background email error for group {gid}: {e}")
        t = threading.Thread(target=send_emails_background, daemon=True)
        t.start()

    if not unique_groups:
        return jsonify({
            "success": True,
            "message": (
                f"Processed {total_before} learner(s) in the queue — no compatible matches could be formed yet. "
                f"Groups may still be incomplete (not enough peers with compatible preferences). "
                f"{pending_after} learner(s) remain in queue."
            )
        })

    return jsonify({
        "success": True,
        "message": (
            f"Auto-match complete! Formed {len(unique_groups)} new group(s) from {total_before} queued learner(s). "
            f"Match emails are being sent in the background. "
            f"{pending_after} learner(s) remain in queue."
        )
    })

# --- FIXED UNPAIRING LOGIC ---
@app.route('/api/leave-group', methods=['POST'])
@api_wrapper
def leave_group():
    data = request.get_json() or {}
    target_id = str(data.get('user_id', '')).strip()

    if not target_id:
        return jsonify({"error": "No User ID provided"}), 400

    delete_profile = bool(data.get('delete_profile', False))
    reason = str(data.get('reason') or 'User Requested').strip()

    # FIX A: str(None) = 'none' which is truthy — use `or ''` to guard against null from JS
    raw_ghost = data.get('ghoster_email')
    ghoster_email = str(raw_ghost).strip().lower() if raw_ghost not in (None, '', 'null', 'None') else ''

    df = download_csv()

    # Locate the user by UUID or email
    user_mask = df['id'] == target_id
    if not user_mask.any():
        user_mask = df['email'].str.lower() == target_id.lower()
    if not user_mask.any():
        return jsonify({"error": "User not found"}), 404

    idx = df.index[user_mask][0]
    user_row = df.loc[idx].copy()

    # 1. Log the unpair reason
    try:
        df_reasons = download_csv(UNPAIR_REASONS_KEY)
        new_reason = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'user_id': target_id,
            'email': user_row.get('email', ''),
            'program': user_row.get('program', ''),
            'course': user_row.get('course', ''),
            'reason': reason,
            'ghoster_email': ghoster_email
        }
        df_reasons = pd.concat([df_reasons, pd.DataFrame([new_reason])], ignore_index=True)
        upload_csv(df_reasons, UNPAIR_REASONS_KEY)
    except Exception as e:
        logger.error(f"Error saving unpair reasons: {e}")

    # 2. Gentle Nudge Engine — only fires if reason contains "Ghosting" AND a valid email is given
    # FIX A (continued): also require '@' so we never process 'none', '', or other junk values
    if 'Ghosting' in reason and ghoster_email and '@' in ghoster_email:
        try:
            no_show_df = download_csv(NO_SHOW_OBJECT_KEY)
            new_no_show = {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'reporter': user_row.get('email', ''),
                'ghoster': ghoster_email
            }
            no_show_df = pd.concat([no_show_df, pd.DataFrame([new_no_show])], ignore_index=True)
            upload_csv(no_show_df, NO_SHOW_OBJECT_KEY)
        except Exception as e:
            logger.error(f"Error saving no-show record: {e}")

        ghoster_rows = df[df['email'] == ghoster_email].copy()
        for g_idx, g_user in ghoster_rows.iterrows():
            g_name = g_user.get('name', 'Learner')
            g_prog = g_user.get('program', user_row.get('program', ''))
            g_type = g_user.get('connection_type', '')

            subject = "PeerFinder - Session Attendance Notice"
            body = (
                f"Hi <strong>{g_name}</strong>,<br/><br/>Your matched peer has flagged you for not showing "
                f"up to your recent session. We understand juggling life and learning can be tough! "
                f"When you have more capacity and are ready to try again, feel free to reregister on PeerFinder."
                f"<br/><br/>Best regards,<br/><strong>Peer Finder Team</strong>"
            )
            try:
                send_email(ghoster_email, subject, body, g_prog, is_html=True)
            except Exception as e:
                logger.error(f"Error sending ghosting nudge email: {e}")

            # Only remove Study Buddy / Group members — volunteers stay in the marketplace
            if g_type in ['find', 'group']:
                df = df.drop(index=g_idx)  # reassign — safer than inplace=True

    # 3. Group dissolution
    # Re-check idx is still valid (edge case: user somehow matched ghoster's email)
    if idx not in df.index:
        upload_csv(df)
        return jsonify({"success": True})

    old_group_id = str(df.at[idx, 'group_id']).strip()

    if old_group_id and old_group_id not in ('', 'nan'):
        other_members = df[(df['group_id'] == old_group_id) & (df['id'] != target_id)]

        if not other_members.empty:
            # Update volunteer's capacity counter if one exists in the group
            vol_in_group = other_members[other_members['connection_type'] == 'offer']
            if not vol_in_group.empty:
                v_idx = vol_in_group.index[0]
                df.at[v_idx, 'current_load'] = max(0, int(df.at[v_idx, 'current_load'] or 0) - 1)

            # FIX B: Free ALL other non-volunteer members — works for 2-person pairs,
            # volunteer groups, AND groups of 3–5 find/group learners.
            for o_idx in other_members.index.tolist():
                if str(df.at[o_idx, 'connection_type']) != 'offer':
                    df.at[o_idx, 'matched'] = False
                    df.at[o_idx, 'group_id'] = ''
                    df.at[o_idx, 'timestamp'] = datetime.now(timezone.utc).isoformat()
                    df.at[o_idx, 'match_attempted'] = False

    # 4. Free or delete the requesting user
    if delete_profile:
        if idx in df.index:
            df = df.drop(index=idx)
    else:
        if idx in df.index:
            df.at[idx, 'matched'] = False
            df.at[idx, 'group_id'] = ''
            df.at[idx, 'unpair_reason'] = reason
            df.at[idx, 'current_load'] = 0
            df.at[idx, 'timestamp'] = datetime.now(timezone.utc).isoformat()
            df.at[idx, 'match_attempted'] = False

    upload_csv(df)
    return jsonify({"success": True})

@app.route('/api/feedback', methods=['POST'])
@api_wrapper
def submit_tool_feedback():
    data = request.get_json()
    df = download_csv(FEEDBACK_OBJECT_KEY)
    new_row = {'id': str(uuid.uuid4()), 'rating': data.get('rating'), 'comment': data.get('comment', ''), 'timestamp': datetime.now(timezone.utc).isoformat()}
    df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
    upload_csv(df, FEEDBACK_OBJECT_KEY)
    return jsonify({"success": True})

@app.route('/api/peer-feedback', methods=['POST'])
@api_wrapper
def submit_peer_session_feedback():
    data = request.get_json()

    # --- 1. HANDLE THE GENTLE NUDGE & GHOSTER DELETION ---
    ghoster_emails_str = data.get('ghoster_emails', '')
    if ghoster_emails_str:
        emails = [e.strip().lower() for e in ghoster_emails_str.split(',') if e.strip()]
        if emails:
            main_df = download_csv(CSV_OBJECT_KEY)
            no_show_df = download_csv(NO_SHOW_OBJECT_KEY)
            modified_main = False

            for g_email in emails:
                new_no_show = {'timestamp': datetime.now(timezone.utc).isoformat(), 'reporter': data.get('email', ''), 'ghoster': g_email}
                no_show_df = pd.concat([no_show_df, pd.DataFrame([new_no_show])], ignore_index=True)

                ghoster_rows = main_df[main_df['email'] == g_email]
                for idx, g_user in ghoster_rows.iterrows():
                    g_name = g_user.get('name', 'Learner')
                    g_prog = g_user.get('program', data.get('program', 'AIFW'))
                    g_type = g_user.get('connection_type', '')

                    subject = "PeerFinder - Session Attendance Notice"
                    body = f"Hi <strong>{g_name}</strong>,<br/><br/>Your matched peer has flagged you for ghosting / not showing up to your recent session. <br/><br/>We understand juggling life and learning can be tough! When you have more capacity and are ready to try again, please feel free to reregister on PeerFinder.<br/><br/>Best regards,<br/><strong>Peer Finder Team</strong>"
                    send_email(g_email, subject, body, g_prog, is_html=True)

                    # ONLY delete if they are standard Study Buddy / Group
                    if g_type in ['find', 'group']:
                        main_df = main_df.drop(index=idx)
                        modified_main = True

            upload_csv(no_show_df, NO_SHOW_OBJECT_KEY)
            if modified_main: upload_csv(main_df, CSV_OBJECT_KEY)

    # --- 2. HANDLE SUBMITTER AUTONOMY (Rematch or Delete) ---
    rematch_request = data.get('rematch_request', '')
    submitter_email = data.get('email', '').strip().lower()

    if rematch_request in ['Rematch', 'Delete']:
        main_df = download_csv(CSV_OBJECT_KEY)
        submitter_rows = main_df[main_df['email'] == submitter_email]
        if not submitter_rows.empty:
            idx = submitter_rows.index[0]
            if rematch_request == 'Delete':
                main_df = main_df.drop(index=idx)
            elif rematch_request == 'Rematch':
                main_df.at[idx, 'matched'] = False
                main_df.at[idx, 'group_id'] = ''
                main_df.at[idx, 'match_attempted'] = False
                main_df.at[idx, 'timestamp'] = datetime.now(timezone.utc).isoformat()
            upload_csv(main_df, CSV_OBJECT_KEY)

    # --- 3. SAVE THE ULTRA-LEAN FEEDBACK ---
    df_feedback = download_csv(SESSION_FEEDBACK_OBJECT_KEY)
    new_row = {
        'id': str(uuid.uuid4()),
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'email': data.get('email', ''),
        'program': data.get('program', ''),
        'course': data.get('course', ''),
        'role': data.get('role', ''),
        'volunteer_email': data.get('volunteer_email', ''),
        'session_happened': data.get('session_happened', ''),
        'ghoster_emails': data.get('ghoster_emails', ''),
        'rematch_request': data.get('rematch_request', ''),
        'overall_rating': data.get('overall_rating', 0),
        'progress': data.get('progress', ''),
        'feedback_details': data.get('feedback_details', '')
    }
    df_feedback = pd.concat([df_feedback, pd.DataFrame([new_row])], ignore_index=True)
    upload_csv(df_feedback, SESSION_FEEDBACK_OBJECT_KEY)

    return jsonify({"success": True})

@app.route('/api/leaderboard', methods=['GET'])
@api_wrapper
def get_leaderboard():
    df_feedback = download_csv(SESSION_FEEDBACK_OBJECT_KEY)
    if df_feedback.empty or 'volunteer_email' not in df_feedback.columns: return jsonify({"success": True, "leaderboard": []})

    df_users = download_csv(CSV_OBJECT_KEY)

    df_feedback['volunteer_email'] = df_feedback['volunteer_email'].astype(str).str.strip().str.lower()
    df_feedback['overall_rating'] = pd.to_numeric(df_feedback['overall_rating'], errors='coerce').fillna(0)

    valid_feedback = df_feedback[(df_feedback['volunteer_email'] != '') & (df_feedback['volunteer_email'] != 'nan')]

    if not valid_feedback.empty:
        leaders = valid_feedback.groupby('volunteer_email')['overall_rating'].sum().reset_index()
        leaders = leaders.sort_values(by='overall_rating', ascending=False).head(10)
    else:
        return jsonify({"success": True, "leaderboard": []})

    leaderboard = []
    for _, row in leaders.iterrows():
        p_email = row['volunteer_email']
        score = int(row['overall_rating'])
        user_match = df_users[df_users['email'].str.lower() == p_email]

        # Display pseudonym instead of full name to protect Volunteer privacy
        name = p_email.split('@')[0]
        if not user_match.empty:
            name = user_match.iloc[0].get('pseudonym') or user_match.iloc[0]['name']

        leaderboard.append({"name": name, "score": score})

    return jsonify({"success": True, "leaderboard": leaderboard})

@app.route('/api/admin/data', methods=['POST'])
@api_wrapper
def get_admin_data():
    if request.get_json().get('password') != ADMIN_PASSWORD: return jsonify({"error": "Unauthorized"}), 401

    df = download_csv()
    total = len(df)
    matched_count = len(df[df['matched'] == True])
    pending_count = total - matched_count
    match_rate = f"{(matched_count / total * 100):.1f}%" if total > 0 else "0.0%"

    matched_df = df[df['matched'] == True].dropna(subset=['timestamp', 'matched_timestamp']).copy()
    if not matched_df.empty:
        matched_df['ts'] = pd.to_datetime(matched_df['timestamp'], errors='coerce', utc=True)
        matched_df['mts'] = pd.to_datetime(matched_df['matched_timestamp'], errors='coerce', utc=True)
        wait_times = (matched_df['mts'] - matched_df['ts']).dt.total_seconds() / 3600
        med_wait = wait_times[wait_times >= 0].median()
        if pd.isna(med_wait): match_speed = "N/A"
        elif med_wait < 1: match_speed = f"{int(med_wait * 60)} Mins"
        else: match_speed = f"{med_wait:.1f} Hrs"
    else: match_speed = "N/A"

    try:
        df_feedback = download_csv(FEEDBACK_OBJECT_KEY)
        if not df_feedback.empty and 'rating' in df_feedback.columns:
            avg_rating = pd.to_numeric(df_feedback['rating'], errors='coerce').mean()
            tool_rating = f"{avg_rating:.1f} / 5.0" if pd.notna(avg_rating) else "N/A"
        else: tool_rating = "N/A"
    except Exception: tool_rating = "N/A"

    stats = {
        "total": total, "matched": matched_count, "pending": pending_count, "match_rate": match_rate,
        "match_speed": match_speed, "tool_rating": tool_rating
    }
    return jsonify({"success": True, "stats": stats, "learners": df.fillna("").to_dict('records')})

@app.route('/api/admin/random-pair', methods=['POST'])
@api_wrapper
def random_pair():
    data = request.get_json()
    if data.get('password') != ADMIN_PASSWORD: return jsonify({"error": "Unauthorized"}), 401
    tid = data.get('user_id')
    df = download_csv()
    t_row = df[df['id'] == tid]
    if t_row.empty: return jsonify({"error": "User not found"}), 404
    if bool(t_row.iloc[0]['matched']): return jsonify({"error": "Already matched"}), 400

    user = t_row.iloc[0]
    size = str(user['group_size']).replace('.0', '').strip() if pd.notna(user['group_size']) else '2'
    pool = df[(df['matched'] == False) & (df['id'] != tid) & (df['program'].apply(normalize_str) == normalize_str(user['program'])) & (df['group_size'].astype(str).str.replace('.0', '', regex=False).str.strip() == size)]

    needed = int(size) - 1
    if len(pool) < needed: return jsonify({"success": False, "message": "Not enough learners in the queue for this group size."}), 200

    peers = pool.sample(n=needed)
    gid = f"group-random-{uuid.uuid4()}"
    iso = datetime.now(timezone.utc).isoformat()

    idx_list = [t_row.index[0]] + peers.index.tolist()
    df.loc[idx_list, 'matched'] = True
    df.loc[idx_list, 'group_id'] = gid
    df.loc[idx_list, 'matched_timestamp'] = iso
    upload_csv(df)
    notify_group_match(df, gid)
    return jsonify({"success": True, "message": "Matched!"})

@app.route('/api/admin/manual-pair', methods=['POST'])
@api_wrapper
def manual_pair():
    data = request.get_json()
    if data.get('password') != ADMIN_PASSWORD: return jsonify({"error": "Unauthorized"}), 401
    ids = data.get('user_ids', [])
    if len(ids) < 2: return jsonify({"error": "Select 2+"}), 400
    df = download_csv()
    rows = df[df['id'].isin(ids)]
    if len(rows) != len(ids): return jsonify({"error": "Users not found"}), 404
    if rows['matched'].any(): return jsonify({"error": "Already matched"}), 400
    gid = f"group-manual-{uuid.uuid4()}"
    iso = datetime.now(timezone.utc).isoformat()
    df.loc[rows.index, 'matched'] = True
    df.loc[rows.index, 'group_id'] = gid
    df.loc[rows.index, 'matched_timestamp'] = iso
    upload_csv(df)
    notify_group_match(df, gid)
    return jsonify({"success": True, "message": "Paired!"})

@app.route('/api/admin/nudge-feedback', methods=['POST'])
@api_wrapper
def nudge_feedback():
    if request.json.get('password') != ADMIN_PASSWORD: return jsonify({'success': False}), 401
    df_peers = download_csv()
    df_feed = download_csv(SESSION_FEEDBACK_OBJECT_KEY)

    three_days_ago = datetime.now(timezone.utc) - timedelta(days=3)
    nudged_count = 0

    for idx, row in df_peers[df_peers['matched'] == True].iterrows():
        try:
            match_time = datetime.fromisoformat(str(row['matched_timestamp']))
            if match_time < three_days_ago:
                has_feedback = not df_feed[df_feed['email'] == row['email']].empty
                if not has_feedback:
                    send_email(
                        to=row['email'],
                        subject="Rate your ALX Peer Session! ⭐",
                        body=f"Hi {row['name']},<br/><br/>We noticed you were matched a few days ago for {row['course']}. Please log in to PeerFinder and submit your session feedback to help your peers earn Legacy Points!<br/><br/>Thank you.",
                        program_name=row['program']
                    )
                    nudged_count += 1
        except: pass

    return jsonify({'success': True, 'message': f'Sent nudges to {nudged_count} learners.'})

# --- FILE DOWNLOADS ---
@app.route('/api/admin/download', methods=['POST'])
@api_wrapper
def admin_dl():
    if request.get_json().get('password') != ADMIN_PASSWORD: return jsonify({"error": "Unauthorized"}), 401
    return Response(download_csv().to_csv(index=False), mimetype='text/csv')

@app.route('/api/admin/download-feedback', methods=['POST'])
@api_wrapper
def dl_feedback():
    if request.get_json().get('password') != ADMIN_PASSWORD: return jsonify({"error": "Unauthorized"}), 401
    return Response(download_csv(FEEDBACK_OBJECT_KEY).to_csv(index=False), mimetype='text/csv')

@app.route('/api/admin/download-session-feedback', methods=['POST'])
@api_wrapper
def dl_session_feedback():
    if request.get_json().get('password') != ADMIN_PASSWORD: return jsonify({"error": "Unauthorized"}), 401
    return Response(download_csv(SESSION_FEEDBACK_OBJECT_KEY).to_csv(index=False), mimetype='text/csv')

@app.route('/api/admin/download-unpair-reasons', methods=['POST'])
@api_wrapper
def download_unpair_reasons():
    if request.json.get('password') != ADMIN_PASSWORD: return jsonify({'success': False}), 401
    return Response(download_csv(UNPAIR_REASONS_KEY).to_csv(index=False), mimetype='text/csv')

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
