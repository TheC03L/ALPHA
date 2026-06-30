from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config
import jwt, os, traceback, logging
logging.basicConfig(filename='/tmp/alpha-error.log', level=logging.ERROR, format='%(asctime)s %(message)s')

db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*")
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app)
    socketio.init_app(app)
    login_manager.init_app(app)

    login_manager.login_view = 'auth.login'
    login_manager.unauthorized_handler(lambda: (jsonify({'error': 'Unauthorized'}), 401))

    @login_manager.user_loader
    def load_user(user_id):
        from models.models import User
        return User.query.get(user_id)

    @login_manager.request_loader
    def load_user_from_request(req):
        from models.models import User
        auth = req.headers.get('Authorization', '').replace('Bearer ', '')
        if not auth:
            auth = req.args.get('token', '')
        if not auth:
            return None
        try:
            data = jwt.decode(auth, Config.JWT_SECRET, algorithms=['HS256'])
            return User.query.get(data.get('user_id'))
        except:
            return None

    from api.auth import auth_bp
    from api.storage import storage_bp
    from api.devices import devices_bp
    from api.ai import ai_bp
    from api.extensions import extensions_bp
    from api.system import system_bp
    from api.notifications import notifications_bp
    from api.users import users_bp
    from api.remote import remote_bp
    from api.apps import apps_bp
    from api.popups import popups_bp
    from api.shares import shares_bp
    from api.trash import trash_bp
    from api.recent import recent_bp
    from api.tools import tools_bp
    from api.system_tools import sys_tools_bp
    from api.display import display_bp
    from api.wifi import wifi_bp
    from api.downloads import downloads_bp
    from api.monitor import monitor_bp
    from api.backup import backup_bp
    from api.crypto import crypto_bp
    from api.permissions import permissions_bp
    from api.wallpaper import wallpaper_bp
    from api.endpoints import firewall_bp, dns_bp, proxy_bp, processes_bp
    from api.endpoints import music_bp, videos_bp, photos_bp, podcasts_bp
    from api.endpoints import bookmarks_bp, notes_bp, calendar_bp, network_bp
    from api.endpoints import audit_bp, encryption_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(storage_bp, url_prefix='/api/storage')
    app.register_blueprint(devices_bp, url_prefix='/api/devices')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(extensions_bp, url_prefix='/api/extensions')
    app.register_blueprint(system_bp, url_prefix='/api/system')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(remote_bp, url_prefix='/api/remote')
    app.register_blueprint(apps_bp, url_prefix='/api/apps')
    app.register_blueprint(popups_bp, url_prefix='/api/popups')
    app.register_blueprint(shares_bp, url_prefix='/api/shares')
    app.register_blueprint(trash_bp, url_prefix='/api/trash')
    app.register_blueprint(recent_bp, url_prefix='/api')
    app.register_blueprint(tools_bp, url_prefix='/api/tools')
    app.register_blueprint(sys_tools_bp, url_prefix='/api/system')
    app.register_blueprint(display_bp, url_prefix='/api/display')
    app.register_blueprint(wifi_bp, url_prefix='/api/wifi')
    app.register_blueprint(downloads_bp, url_prefix='/api/downloads')
    app.register_blueprint(monitor_bp, url_prefix='/api/monitor')
    app.register_blueprint(backup_bp, url_prefix='/api/backup')
    app.register_blueprint(crypto_bp, url_prefix='/api/crypto')
    app.register_blueprint(permissions_bp, url_prefix='/api/permissions')
    app.register_blueprint(wallpaper_bp, url_prefix='/api/wallpaper')
    app.register_blueprint(firewall_bp, url_prefix='/api/firewall')
    app.register_blueprint(dns_bp, url_prefix='/api/dns')
    app.register_blueprint(proxy_bp, url_prefix='/api/proxy')
    app.register_blueprint(processes_bp, url_prefix='/api/processes')
    app.register_blueprint(music_bp, url_prefix='/api/music')
    app.register_blueprint(videos_bp, url_prefix='/api/videos')
    app.register_blueprint(photos_bp, url_prefix='/api/photos')
    app.register_blueprint(podcasts_bp, url_prefix='/api/podcasts')
    app.register_blueprint(bookmarks_bp, url_prefix='/api/bookmarks')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(calendar_bp, url_prefix='/api/calendar')
    app.register_blueprint(network_bp, url_prefix='/api/network')
    app.register_blueprint(audit_bp, url_prefix='/api/audit')
    app.register_blueprint(encryption_bp, url_prefix='/api/encryption')

    @app.route('/api/status')
    def status():
        return jsonify({'status': 'online', 'name': 'ALPHA', 'version': '1.0.0'})

    # Serve built frontend for SPA routes
    frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'ui', 'dist')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/') or path == 'api':
            return jsonify({'error': 'Not found'}), 404
        full_path = os.path.join(frontend_dir, path)
        if path and os.path.exists(full_path) and os.path.isfile(full_path):
            return send_from_directory(frontend_dir, path)
        index_path = os.path.join(frontend_dir, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(frontend_dir, 'index.html')
        return jsonify({'error': 'Frontend not built. Run: cd ui && npm run build'}), 503

    with app.app_context():
        db.create_all()

    app.config['TRAP_HTTP_EXCEPTIONS'] = True

    @app.errorhandler(Exception)
    def handle_error(e):
        tb = traceback.format_exc()
        print("=== HANDLED ERROR ===", flush=True)
        print(tb, flush=True)
        print("=====================", flush=True)
        logging.error("Unhandled: %s\n%s", e, tb)
        return jsonify({'error': str(e), 'traceback': tb}), 500

    from api.monitor import start_collector
    start_collector(app)
    from api.storage import start_drive_watcher
    start_drive_watcher(app)

    return app

# WSGI-level error catcher (used by run.py)
class ErrorCatchMiddleware:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app
    def __call__(self, environ, start_response):
        try:
            return self.wsgi_app(environ, start_response)
        except Exception as e:
            tb = traceback.format_exc()
            print("=== SERVER CRASH ===")
            print(tb)
            print("====================")
            body = jsonify({'error': str(e), 'traceback': tb}).get_data()
            headers = [('Content-Type', 'application/json'), ('Content-Length', str(len(body)))]
            start_response('500 INTERNAL SERVER ERROR', headers)
            return [body]
