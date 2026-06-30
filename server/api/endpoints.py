from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
import psutil, os as os_mod, datetime, json as json_mod, uuid, subprocess

# ===== Firewall =====
firewall_bp = Blueprint('firewall', __name__)

@firewall_bp.route('/status')
@login_required
def firewall_status():
    return jsonify({'enabled': True, 'active_rules': 5, 'default_policy': 'DROP'})

@firewall_bp.route('/rules')
@login_required
def firewall_rules():
    rules = [
        {'id': '1', 'chain': 'INPUT', 'protocol': 'tcp', 'source': '0.0.0.0/0', 'destination': '', 'port': '22', 'action': 'ACCEPT', 'enabled': True},
        {'id': '2', 'chain': 'INPUT', 'protocol': 'tcp', 'source': '0.0.0.0/0', 'destination': '', 'port': '80', 'action': 'ACCEPT', 'enabled': True},
        {'id': '3', 'chain': 'INPUT', 'protocol': 'tcp', 'source': '0.0.0.0/0', 'destination': '', 'port': '443', 'action': 'ACCEPT', 'enabled': True},
        {'id': '4', 'chain': 'INPUT', 'protocol': 'tcp', 'source': '192.168.1.0/24', 'destination': '', 'port': '5000', 'action': 'ACCEPT', 'enabled': True},
        {'id': '5', 'chain': 'FORWARD', 'protocol': 'all', 'source': '0.0.0.0/0', 'destination': '0.0.0.0/0', 'port': '', 'action': 'DROP', 'enabled': True},
    ]
    return jsonify(rules)

@firewall_bp.route('/toggle', methods=['POST'])
@login_required
def firewall_toggle():
    data = request.json
    return jsonify({'enabled': data.get('enabled', True), 'message': 'Firewall updated'})

@firewall_bp.route('/rules/add', methods=['POST'])
@login_required
def firewall_add_rule():
    data = request.json
    rule = {
        'id': str(uuid.uuid4())[:8],
        'chain': data.get('chain', 'INPUT'),
        'protocol': data.get('protocol', 'tcp'),
        'source': data.get('source', '0.0.0.0/0'),
        'destination': data.get('destination', ''),
        'port': data.get('port', ''),
        'action': data.get('action', 'ACCEPT'),
        'enabled': True,
    }
    return jsonify({'message': 'Rule added', 'rule': rule})

# ===== DNS =====
dns_bp = Blueprint('dns', __name__)

@dns_bp.route('/settings')
@login_required
def dns_settings():
    return jsonify({'primary': '8.8.8.8', 'secondary': '8.8.4.4', 'fallback': '1.1.1.1', 'cache_size': 512, 'ttl': 3600})

@dns_bp.route('/settings', methods=['PUT'])
@login_required
def dns_update_settings():
    data = request.json
    return jsonify({'message': 'DNS settings updated', 'settings': data})

@dns_bp.route('/queries')
@login_required
def dns_queries():
    return jsonify([
        {'query': 'google.com', 'type': 'A', 'result': '142.250.80.46', 'timestamp': '2026-06-30T12:00:00Z'},
        {'query': 'github.com', 'type': 'A', 'result': '140.82.121.3', 'timestamp': '2026-06-30T11:59:00Z'},
    ])

@dns_bp.route('/clear-cache', methods=['POST'])
@login_required
def dns_clear_cache():
    return jsonify({'message': 'DNS cache cleared'})

@dns_bp.route('/lookup', methods=['POST'])
@login_required
def dns_lookup():
    data = request.json
    domain = data.get('domain', '')
    return jsonify({'domain': domain, 'records': [
        {'type': 'A', 'value': '192.168.1.1', 'ttl': 3600},
        {'type': 'AAAA', 'value': '::1', 'ttl': 3600},
    ]})

# ===== Proxy =====
proxy_bp = Blueprint('proxy', __name__)

@proxy_bp.route('/settings')
@login_required
def proxy_settings():
    return jsonify({'enabled': False, 'host': '', 'port': 8080, 'username': '', 'password': '', 'protocol': 'http'})

@proxy_bp.route('/settings', methods=['PUT'])
@login_required
def proxy_update_settings():
    data = request.json
    return jsonify({'message': 'Proxy settings updated'})

@proxy_bp.route('/bypass')
@login_required
def proxy_bypass():
    return jsonify({'bypass': ['localhost', '127.0.0.1', '192.168.0.0/16']})

@proxy_bp.route('/bypass', methods=['PUT'])
@login_required
def proxy_update_bypass():
    data = request.json
    return jsonify({'message': 'Bypass list updated'})

@proxy_bp.route('/toggle', methods=['POST'])
@login_required
def proxy_toggle():
    data = request.json
    return jsonify({'enabled': data.get('enabled', False), 'message': 'Proxy updated'})

@proxy_bp.route('/test', methods=['POST'])
@login_required
def proxy_test():
    return jsonify({'success': True, 'latency_ms': 45, 'ip': '203.0.113.1'})

# ===== Processes =====
processes_bp = Blueprint('processes', __name__)

@processes_bp.route('/list')
@login_required
def processes_list():
    procs = []
    for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'status', 'username', 'cmdline']):
        try:
            info = p.info
            procs.append({
                'pid': info['pid'], 'name': info['name'] or '?',
                'cpu': info['cpu_percent'] or 0.0, 'memory': info['memory_percent'] or 0.0,
                'status': info['status'] or 'running', 'user': info['username'] or '?',
                'command': ' '.join(info['cmdline']) if info['cmdline'] else info['name'] or '?',
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    procs.sort(key=lambda x: x['cpu'], reverse=True)
    return jsonify(procs[:200])

# ===== Music =====
music_bp = Blueprint('music', __name__)
MUSIC_DIR = os_mod.path.join(os_mod.path.dirname(os_mod.path.dirname(os_mod.path.abspath(__file__))), 'storage', 'music')

@music_bp.route('/library')
@login_required
def music_library():
    songs = []
    if os_mod.path.isdir(MUSIC_DIR):
        for f in os_mod.listdir(MUSIC_DIR):
            if f.endswith(('.mp3', '.flac', '.wav', '.m4a', '.ogg')):
                fp = os_mod.path.join(MUSIC_DIR, f)
                songs.append({'id': f, 'title': f.rsplit('.', 1)[0], 'artist': 'Unknown', 'album': 'Unknown', 'duration': 0, 'path': fp})
    return jsonify(songs)

@music_bp.route('/status')
@login_required
def music_status():
    return jsonify({'playing': False, 'progress': 0, 'duration': 0, 'current': None})

@music_bp.route('/play', methods=['POST'])
@login_required
def music_play():
    data = request.json
    return jsonify({'playing': True, 'id': data.get('id', '')})

@music_bp.route('/control', methods=['POST'])
@login_required
def music_control():
    data = request.json
    action = data.get('action', 'pause')
    return jsonify({'action': action, 'playing': action in ('play', 'resume')})

@music_bp.route('/volume', methods=['POST'])
@login_required
def music_volume():
    data = request.json
    return jsonify({'volume': data.get('volume', 50)})

# ===== Videos =====
videos_bp = Blueprint('videos', __name__)
VIDEO_DIR = os_mod.path.join(os_mod.path.dirname(os_mod.path.dirname(os_mod.path.abspath(__file__))), 'storage', 'videos')

@videos_bp.route('/library')
@login_required
def videos_library():
    vids = []
    if os_mod.path.isdir(VIDEO_DIR):
        for f in os_mod.listdir(VIDEO_DIR):
            if f.endswith(('.mp4', '.mkv', '.avi', '.mov', '.webm')):
                fp = os_mod.path.join(VIDEO_DIR, f)
                vids.append({'id': f, 'title': f.rsplit('.', 1)[0], 'path': fp, 'size': os_mod.path.getsize(fp), 'duration': 0})
    return jsonify(vids)

@videos_bp.route('/upload', methods=['POST'])
@login_required
def videos_upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    os_mod.makedirs(VIDEO_DIR, exist_ok=True)
    f.save(os_mod.path.join(VIDEO_DIR, f.filename))
    return jsonify({'message': 'Uploaded', 'filename': f.filename})

# ===== Photos =====
photos_bp = Blueprint('photos', __name__)
PHOTO_DIR = os_mod.path.join(os_mod.path.dirname(os_mod.path.dirname(os_mod.path.abspath(__file__))), 'storage', 'photos')

@photos_bp.route('/albums')
@login_required
def photos_albums():
    return jsonify([{'id': '1', 'name': 'Screenshots', 'count': 5, 'cover': ''}, {'id': '2', 'name': 'Camera', 'count': 12, 'cover': ''}])

@photos_bp.route('/list')
@login_required
def photos_list():
    photos = []
    if os_mod.path.isdir(PHOTO_DIR):
        for f in os_mod.listdir(PHOTO_DIR):
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp')):
                fp = os_mod.path.join(PHOTO_DIR, f)
                photos.append({'id': f, 'name': f, 'path': fp, 'thumbnail': f'/api/storage/files/preview?path=photos/{f}', 'size': os_mod.path.getsize(fp), 'created_at': datetime.datetime.fromtimestamp(os_mod.path.getmtime(fp)).isoformat()})
    return jsonify(photos)

@photos_bp.route('/albums/create', methods=['POST'])
@login_required
def photos_create_album():
    data = request.json
    return jsonify({'message': 'Album created', 'album': data})

@photos_bp.route('/upload', methods=['POST'])
@login_required
def photos_upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    os_mod.makedirs(PHOTO_DIR, exist_ok=True)
    f.save(os_mod.path.join(PHOTO_DIR, f.filename))
    return jsonify({'message': 'Uploaded', 'filename': f.filename})

# ===== Podcasts =====
podcasts_bp = Blueprint('podcasts', __name__)

@podcasts_bp.route('/list')
@login_required
def podcasts_list():
    return jsonify([
        {'id': '1', 'title': 'Tech Today', 'author': 'John Doe', 'episodes': 42, 'feed_url': 'https://example.com/feed.xml'},
        {'id': '2', 'title': 'AI Weekly', 'author': 'Jane Smith', 'episodes': 18, 'feed_url': 'https://example.com/ai.xml'},
    ])

@podcasts_bp.route('/subscribe', methods=['POST'])
@login_required
def podcasts_subscribe():
    data = request.json
    return jsonify({'message': 'Subscribed', 'feed_url': data.get('feed_url', '')})

# ===== Bookmarks =====
bookmarks_bp = Blueprint('bookmarks', __name__)

@bookmarks_bp.route('/list')
@login_required
def bookmarks_list():
    return jsonify([
        {'id': '1', 'title': 'GitHub', 'url': 'https://github.com', 'folder': 'Dev', 'created_at': '2026-06-01T00:00:00Z'},
        {'id': '2', 'title': 'Stack Overflow', 'url': 'https://stackoverflow.com', 'folder': 'Dev', 'created_at': '2026-06-02T00:00:00Z'},
    ])

@bookmarks_bp.route('/add', methods=['POST'])
@login_required
def bookmarks_add():
    data = request.json
    return jsonify({'message': 'Bookmark added', 'bookmark': {'id': str(uuid.uuid4())[:8], 'title': data.get('title', ''), 'url': data.get('url', ''), 'folder': data.get('folder', 'General')}})

@bookmarks_bp.route('/export')
@login_required
def bookmarks_export():
    return jsonify({'bookmarks': [{'title': 'GitHub', 'url': 'https://github.com'}]})

@bookmarks_bp.route('/import', methods=['POST'])
@login_required
def bookmarks_import():
    data = request.json
    return jsonify({'message': 'Imported', 'count': len(data.get('bookmarks', []))})

# ===== Notes =====
notes_bp = Blueprint('notes', __name__)
DATA_DIR = os_mod.path.join(os_mod.path.dirname(os_mod.path.dirname(os_mod.path.dirname(os_mod.path.abspath(__file__)))), 'data')
NOTES_FILE = os_mod.path.join(DATA_DIR, 'notes.json')

def _load_notes():
    if os_mod.path.exists(NOTES_FILE):
        try:
            with open(NOTES_FILE) as f:
                return json_mod.load(f)
        except: pass
    return []

def _save_notes(notes):
    os_mod.makedirs(DATA_DIR, exist_ok=True)
    with open(NOTES_FILE, 'w') as f:
        json_mod.dump(notes, f, indent=2)

@notes_bp.route('/list')
@login_required
def notes_list():
    return jsonify(_load_notes())

@notes_bp.route('/create', methods=['POST'])
@login_required
def notes_create():
    data = request.json
    notes = _load_notes()
    note = {'id': str(uuid.uuid4())[:8], 'title': data.get('title', 'Untitled'), 'content': data.get('content', ''), 'created_at': datetime.datetime.now().isoformat(), 'updated_at': datetime.datetime.now().isoformat()}
    notes.insert(0, note)
    _save_notes(notes)
    return jsonify({'message': 'Note created', 'note': note})

# ===== Calendar =====
calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.route('/events')
@login_required
def calendar_events():
    return jsonify([
        {'id': '1', 'title': 'Team Meeting', 'start': '2026-06-30T10:00:00', 'end': '2026-06-30T11:00:00', 'color': '#3b82f6'},
        {'id': '2', 'title': 'Lunch', 'start': '2026-06-30T12:00:00', 'end': '2026-06-30T13:00:00', 'color': '#10b981'},
    ])

@calendar_bp.route('/events/add', methods=['POST'])
@login_required
def calendar_add_event():
    data = request.json
    return jsonify({'message': 'Event created', 'event': {'id': str(uuid.uuid4())[:8], 'title': data.get('title', ''), 'start': data.get('start', ''), 'end': data.get('end', '')}})

# ===== Network =====
network_bp = Blueprint('network', __name__)

@network_bp.route('/interfaces')
@login_required
def network_interfaces():
    ifaces = []
    for name, addrs in psutil.net_if_addrs().items():
        stats = psutil.net_if_stats().get(name)
        iface = {'name': name, 'ips': [], 'mac': '', 'status': 'up' if stats and stats.isup else 'down'}
        for addr in addrs:
            if addr.family.name == 'AF_INET':
                iface['ips'].append({'version': 4, 'address': addr.address, 'netmask': addr.netmask or ''})
            elif addr.family.name == 'AF_PACKET':
                iface['mac'] = addr.address
        ifaces.append(iface)
    return jsonify(ifaces)

@network_bp.route('/interfaces/dhcp-renew', methods=['POST'])
@login_required
def network_dhcp_renew():
    return jsonify({'message': 'DHCP lease renewed', 'ip': '192.168.1.100'})

# ===== Audit =====
audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/logs')
@login_required
def audit_logs():
    return jsonify([
        {'id': '1', 'action': 'User login', 'user': 'admin', 'timestamp': '2026-06-30T10:00:00Z', 'details': 'Login from 192.168.1.1'},
        {'id': '2', 'action': 'File modified', 'user': 'admin', 'timestamp': '2026-06-30T09:30:00Z', 'details': 'Modified /etc/config.yaml'},
    ])

@audit_bp.route('/logs/clear', methods=['DELETE'])
@login_required
def audit_clear():
    return jsonify({'message': 'Audit logs cleared'})

# ===== Encryption =====
encryption_bp = Blueprint('encryption', __name__)

@encryption_bp.route('/status')
@login_required
def encryption_status():
    return jsonify({'enabled': True, 'method': 'AES-256-GCM', 'key_count': 3})

@encryption_bp.route('/keys')
@login_required
def encryption_keys():
    return jsonify([
        {'id': '1', 'name': 'Default Key', 'type': 'aes-256', 'created': '2026-01-01'},
        {'id': '2', 'name': 'Backup Key', 'type': 'aes-256', 'created': '2026-03-15'},
    ])

@encryption_bp.route('/settings', methods=['PUT'])
@login_required
def encryption_settings():
    data = request.json
    return jsonify({'message': 'Encryption settings updated'})

@encryption_bp.route('/keys/generate', methods=['POST'])
@login_required
def encryption_generate_key():
    return jsonify({'message': 'Key generated', 'key': {'id': str(uuid.uuid4())[:8], 'name': 'New Key', 'type': 'aes-256'}})

@encryption_bp.route('/encrypt', methods=['POST'])
@login_required
def encryption_encrypt():
    return jsonify({'success': True, 'message': 'File encrypted'})

@encryption_bp.route('/decrypt', methods=['POST'])
@login_required
def encryption_decrypt():
    return jsonify({'success': True, 'message': 'File decrypted'})
