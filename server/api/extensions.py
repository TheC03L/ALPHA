from flask import Blueprint, jsonify, request
from main import db
from models.models import Extension
from flask_login import login_required
import requests
import json

extensions_bp = Blueprint('extensions', __name__)
REGISTRY = 'https://api.github.com/repos/TheC03L/Alpha-Extensions/contents'

FALLBACK = [
    # ── Media ──
    {'name': 'plex', 'display_name': 'Plex Media Server', 'description': 'Organize and stream your personal media collection to any device', 'version': '1.32.0', 'author': 'Plex', 'permissions': ['storage:read', 'network', 'media:transcode']},
    {'name': 'jellyfin', 'display_name': 'Jellyfin', 'description': 'Free and open-source media server with streaming, DVR, and live TV', 'version': '10.9.0', 'author': 'Jellyfin Team', 'permissions': ['storage:read', 'network', 'media:transcode']},
    {'name': 'emby', 'display_name': 'Emby', 'description': 'Media server that organizes, streams, and transcodes your media library', 'version': '4.8.0', 'author': 'Emby Team', 'permissions': ['storage:read', 'network', 'media:transcode']},
    {'name': 'tdarr', 'display_name': 'Tdarr', 'description': 'Automated audio/video library transcoding and management', 'version': '2.20.0', 'author': 'HaveAGitGat', 'permissions': ['storage:read', 'storage:write', 'media:transcode']},
    {'name': 'sabnzbd', 'display_name': 'SABnzbd', 'description': 'Automated Usenet downloader with web interface', 'version': '4.3.0', 'author': 'SABnzbd Team', 'permissions': ['storage:write', 'network']},
    {'name': 'sonarr', 'display_name': 'Sonarr', 'description': 'Automated TV series download and library management', 'version': '4.0.0', 'author': 'Sonarr Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'radarr', 'display_name': 'Radarr', 'description': 'Automated movie download and library management', 'version': '5.0.0', 'author': 'Radarr Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'lidarr', 'display_name': 'Lidarr', 'description': 'Automated music download and library management', 'version': '2.0.0', 'author': 'Lidarr Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'readarr', 'display_name': 'Readarr', 'description': 'Automated ebook and audiobook download manager', 'version': '0.3.0', 'author': 'Readarr Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'bazarr', 'display_name': 'Bazarr', 'description': 'Automatic subtitle download and management companion', 'version': '1.4.0', 'author': 'Bazarr Team', 'permissions': ['storage:write', 'network']},
    {'name': 'prowlarr', 'display_name': 'Prowlarr', 'description': 'Indexer manager and proxy for Sonarr, Radarr, and Lidarr', 'version': '1.16.0', 'author': 'Prowlarr Team', 'permissions': ['network']},
    {'name': 'navidrome', 'display_name': 'Navidrome', 'description': 'Self-hosted music streaming server with Subsonic API', 'version': '0.52.0', 'author': 'Navidrome', 'permissions': ['storage:read', 'network']},
    {'name': 'kavita', 'display_name': 'Kavita', 'description': 'Ebook, manga, and comic reader with web interface', 'version': '0.8.0', 'author': 'Kavitareader', 'permissions': ['storage:read', 'network']},
    {'name': 'calibre-web', 'display_name': 'Calibre-Web', 'description': 'Web interface for browsing and reading your Calibre ebook library', 'version': '0.6.21', 'author': 'Janeczku', 'permissions': ['storage:read', 'network']},
    {'name': 'photoprism', 'display_name': 'PhotoPrism', 'description': 'AI-powered photo management and organization server', 'version': '1.0.0', 'author': 'PhotoPrism', 'permissions': ['storage:read', 'ai:vision', 'network']},
    {'name': 'immich', 'display_name': 'Immich', 'description': 'Self-hosted photo and video backup and management', 'version': '1.108.0', 'author': 'Immich Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'shinobi', 'display_name': 'Shinobi Pro', 'description': 'Multi-platform CCTV and NVR surveillance system', 'version': '1.0.0', 'author': 'Moe', 'permissions': ['storage:write', 'video:capture', 'network']},
    # ── Development ──
    {'name': 'code-server', 'display_name': 'VS Code Server', 'description': 'Run VS Code in the browser for remote development', 'version': '4.90.0', 'author': 'Coder', 'permissions': ['process:spawn', 'network']},
    {'name': 'gitlab-runner', 'display_name': 'GitLab Runner', 'description': 'CI/CD job runner for GitLab repositories', 'version': '16.11.0', 'author': 'GitLab', 'permissions': ['process:spawn', 'network']},
    {'name': 'jenkins', 'display_name': 'Jenkins', 'description': 'Extensible CI/CD automation server', 'version': '2.450', 'author': 'Jenkins Project', 'permissions': ['process:spawn', 'storage:write', 'network']},
    {'name': 'gitea', 'display_name': 'Gitea', 'description': 'Lightweight self-hosted Git service with pull requests', 'version': '1.22.0', 'author': 'Gitea Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'jupyter', 'display_name': 'Jupyter Lab', 'description': 'Web-based interactive development environment for notebooks and code', 'version': '4.2.0', 'author': 'Jupyter', 'permissions': ['process:spawn', 'network']},
    {'name': 'postgres-admin', 'display_name': 'pgAdmin', 'description': 'PostgreSQL administration and management web interface', 'version': '8.10', 'author': 'pgAdmin Team', 'permissions': ['network']},
    {'name': 'phpmyadmin', 'display_name': 'phpMyAdmin', 'description': 'MySQL/MariaDB administration web interface', 'version': '5.2.1', 'author': 'phpMyAdmin Team', 'permissions': ['network']},
    {'name': 'portainer', 'display_name': 'Portainer', 'description': 'Container management UI for Docker and Kubernetes', 'version': '2.21.0', 'author': 'Portainer', 'permissions': ['docker:manage', 'network']},
    {'name': 'dozzle', 'display_name': 'Dozzle', 'description': 'Real-time Docker container log viewer', 'version': '7.0.0', 'author': 'Dozzle', 'permissions': ['docker:logs', 'network']},
    # ── Security ──
    {'name': 'fail2ban-gui', 'display_name': 'Fail2ban GUI', 'description': 'Web dashboard for managing Fail2ban jail bans and logs', 'version': '1.2.0', 'author': 'ALPHA', 'permissions': ['system:admin', 'network']},
    {'name': 'clamav', 'display_name': 'ClamAV Scanner', 'description': 'Antivirus engine with on-demand and scheduled file scanning', 'version': '1.3.0', 'author': 'Cisco Talos', 'permissions': ['storage:read', 'process:spawn']},
    {'name': 'crowdsec', 'display_name': 'CrowdSec', 'description': 'Collaborative IPS with behavior analysis and blocklists', 'version': '1.6.0', 'author': 'CrowdSec', 'permissions': ['network', 'system:admin']},
    {'name': 'vaultwarden', 'display_name': 'Vaultwarden', 'description': 'Lightweight Bitwarden-compatible password manager server', 'version': '1.31.0', 'author': 'Vaultwarden', 'permissions': ['storage:write', 'network']},
    {'name': 'authelia', 'display_name': 'Authelia', 'description': 'Single sign-on and multi-factor authentication portal', 'version': '4.38.0', 'author': 'Authelia Team', 'permissions': ['network', 'auth:manage']},
    {'name': 'traefik', 'display_name': 'Traefik', 'description': 'Cloud-native reverse proxy and load balancer with auto-TLS', 'version': '3.1.0', 'author': 'Traefik Labs', 'permissions': ['network', 'cert:manage']},
    {'name': 'n8n-auth-proxy', 'display_name': 'OAuth2 Proxy', 'description': 'Authentication reverse proxy protecting web services', 'version': '7.6.0', 'author': 'OAuth2 Proxy Team', 'permissions': ['network', 'auth:proxy']},
    # ── Automation ──
    {'name': 'home-assistant', 'display_name': 'Home Assistant Bridge', 'description': 'Control and automate smart home devices and scenes', 'version': '2024.5.0', 'author': 'Home Assistant', 'permissions': ['devices:control', 'network']},
    {'name': 'nodered', 'display_name': 'Node-RED', 'description': 'Flow-based low-code programming for IoT and automation', 'version': '4.0.0', 'author': 'OpenJS Foundation', 'permissions': ['process:spawn', 'network']},
    {'name': 'n8n', 'display_name': 'n8n', 'description': 'Technical workflow automation with 400+ integrations', 'version': '1.50.0', 'author': 'n8n', 'permissions': ['process:spawn', 'network']},
    {'name': 'huginn', 'display_name': 'Huginn', 'description': 'Self-hosted agent system for building automated web workflows', 'version': '1.0.0', 'author': 'Huginn Team', 'permissions': ['network', 'process:spawn']},
    {'name': 'changedetection', 'display_name': 'Change Detection', 'description': 'Monitor websites for changes and get notifications', 'version': '0.46.0', 'author': 'dgtlmoon', 'permissions': ['network']},
    # ── Monitoring ──
    {'name': 'grafana', 'display_name': 'Grafana', 'description': 'Metrics analytics and interactive dashboards for any data source', 'version': '11.0.0', 'author': 'Grafana Labs', 'permissions': ['network']},
    {'name': 'netdata', 'display_name': 'Netdata', 'description': 'Real-time system monitoring and performance troubleshooting', 'version': '1.46.0', 'author': 'Netdata', 'permissions': ['system:read', 'network']},
    {'name': 'uptime-kuma', 'display_name': 'Uptime Kuma', 'description': 'Self-hosted uptime monitoring with notifications', 'version': '1.23.0', 'author': 'LouisLam', 'permissions': ['network']},
    {'name': 'prometheus', 'display_name': 'Prometheus', 'description': 'Time-series database and alerting for infrastructure monitoring', 'version': '2.53.0', 'author': 'CNCF', 'permissions': ['network']},
    {'name': 'healthchecks', 'display_name': 'Healthchecks', 'description': 'Cron job monitoring with alerts for failed or missed runs', 'version': '3.4.0', 'author': 'Healthchecks.io', 'permissions': ['network']},
    {'name': 'glances', 'display_name': 'Glances', 'description': 'Cross-platform system monitoring with REST API and web UI', 'version': '4.1.0', 'author': 'Nicolas Hennion', 'permissions': ['system:read', 'network']},
    # ── Network ──
    {'name': 'pihole', 'display_name': 'Pi-hole', 'description': 'DNS-based ad blocking and network-wide tracker prevention', 'version': '5.18.0', 'author': 'Pi-hole LLC', 'permissions': ['network', 'dns:manage']},
    {'name': 'adguard', 'display_name': 'AdGuard Home', 'description': 'Network-wide ad and tracker blocking DNS server', 'version': '0.107.0', 'author': 'AdGuard Team', 'permissions': ['network', 'dns:manage']},
    {'name': 'nginx-proxy', 'display_name': 'Nginx Proxy Manager', 'description': 'Web GUI for managing Nginx reverse proxy with SSL certificates', 'version': '2.11.0', 'author': 'Nginx Proxy Manager', 'permissions': ['network', 'cert:manage']},
    {'name': 'caddy', 'display_name': 'Caddy', 'description': 'Automatic HTTPS web server and reverse proxy', 'version': '2.8.0', 'author': 'Caddy Team', 'permissions': ['network', 'cert:manage']},
    {'name': 'wireguard-ui', 'display_name': 'WireGuard UI', 'description': 'Web interface for managing WireGuard VPN tunnels', 'version': '0.6.0', 'author': 'WireGuard UI Team', 'permissions': ['network', 'vpn:manage']},
    {'name': 'tailscale', 'display_name': 'Tailscale', 'description': 'Zero-config VPN mesh for secure remote access', 'version': '1.66.0', 'author': 'Tailscale', 'permissions': ['network', 'vpn:manage']},
    {'name': 'speedtest-tracker', 'display_name': 'Speedtest Tracker', 'description': 'Run periodic internet speed tests and chart results over time', 'version': '1.3.0', 'author': 'Speedtest Tracker', 'permissions': ['network']},
    # ── AI / Machine Learning ──
    {'name': 'comfyui', 'display_name': 'ComfyUI', 'description': 'Node-based Stable Diffusion image generation workflow UI', 'version': '0.2.0', 'author': 'Comfy Org', 'permissions': ['compute:gpu', 'storage:write', 'network']},
    {'name': 'localai', 'display_name': 'LocalAI', 'description': 'Self-hosted OpenAI-compatible LLM and image generation API', 'version': '2.18.0', 'author': 'LocalAI', 'permissions': ['compute:gpu', 'network']},
    {'name': 'ollama', 'display_name': 'Ollama', 'description': 'Run local LLMs like Llama, Mistral, and Gemma with simple API', 'version': '0.3.0', 'author': 'Ollama', 'permissions': ['compute:gpu', 'network']},
    {'name': 'open-webui', 'display_name': 'Open WebUI', 'description': 'ChatGPT-like interface for local LLMs with Ollama backend', 'version': '0.3.0', 'author': 'Open WebUI Team', 'permissions': ['network']},
    {'name': 'frigate', 'display_name': 'Frigate NVR', 'description': 'AI-powered real-time object detection for security cameras', 'version': '0.14.0', 'author': 'Frigate Team', 'permissions': ['video:capture', 'compute:gpu', 'storage:write']},
    {'name': 'whisper', 'display_name': 'Whisper ASR', 'description': 'OpenAI Whisper speech-to-text server for transcription', 'version': '1.0.0', 'author': 'OpenAI', 'permissions': ['compute:gpu', 'storage:read']},
    # ── Storage ──
    {'name': 'nextcloud', 'display_name': 'Nextcloud', 'description': 'Private cloud suite with file sync, sharing, and collaboration apps', 'version': '29.0.0', 'author': 'Nextcloud GmbH', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'syncthing', 'display_name': 'Syncthing', 'description': 'Peer-to-peer continuous file synchronization across devices', 'version': '1.27.0', 'author': 'Syncthing Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'minio', 'display_name': 'MinIO', 'description': 'S3-compatible object storage server for private cloud', 'version': '1.0.0', 'author': 'MinIO', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'duplicati', 'display_name': 'Duplicati', 'description': 'Encrypted, compressed backups to local and cloud destinations', 'version': '2.0.9', 'author': 'Duplicati Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    {'name': 'filebrowser', 'display_name': 'File Browser', 'description': 'Web file manager with upload, download, and sharing capabilities', 'version': '2.30.0', 'author': 'File Browser', 'permissions': ['storage:read', 'storage:write']},
    {'name': 'rclone-web', 'display_name': 'Rclone Web UI', 'description': 'Cloud storage sync and management with 40+ provider support', 'version': '1.67.0', 'author': 'Rclone Team', 'permissions': ['storage:read', 'storage:write', 'network']},
    # ── Communication ──
    {'name': 'matrix-synapse', 'display_name': 'Matrix Synapse', 'description': 'Decentralized chat server for the Matrix protocol', 'version': '1.109.0', 'author': 'Matrix.org', 'permissions': ['network', 'storage:write']},
    {'name': 'mattermost', 'display_name': 'Mattermost', 'description': 'Self-hosted Slack-alternative team messaging platform', 'version': '9.9.0', 'author': 'Mattermost', 'permissions': ['network', 'storage:write']},
    {'name': 'discourse', 'display_name': 'Discourse', 'description': 'Modern open-source discussion platform and forum', 'version': '3.3.0', 'author': 'Discourse Team', 'permissions': ['network', 'storage:write']},
    {'name': 'gotify', 'display_name': 'Gotify', 'description': 'Self-hosted push notification server with REST API', 'version': '2.6.0', 'author': 'Gotify', 'permissions': ['network']},
    {'name': 'ntfy', 'display_name': 'ntfy', 'description': 'Simple pub-sub push notification service with HTTP API', 'version': '2.11.0', 'author': 'ntfy', 'permissions': ['network']},
    # ── Productivity ──
    {'name': 'paperless-ngx', 'display_name': 'Paperless-ngx', 'description': 'Document management with OCR, tagging, and search', 'version': '2.10.0', 'author': 'Paperless-ngx Team', 'permissions': ['storage:read', 'storage:write', 'ai:vision']},
    {'name': 'wikijs', 'display_name': 'Wiki.js', 'description': 'Feature-rich self-hosted wiki with Markdown and Git-backed storage', 'version': '2.5.303', 'author': 'requarks', 'permissions': ['storage:write', 'network']},
    {'name': 'bookstack', 'display_name': 'BookStack', 'description': 'Simple, organized wiki and documentation platform', 'version': '24.05.0', 'author': 'BookStack', 'permissions': ['storage:write', 'network']},
]


@extensions_bp.route('/')
@login_required
def list_extensions():
    exts = Extension.query.all()
    return jsonify([{
        'id': e.id, 'name': e.name, 'display_name': e.display_name,
        'description': e.description, 'version': e.version, 'author': e.author,
        'installed': e.installed, 'enabled': e.enabled, 'permissions': e.permissions,
        'settings': e.settings
    } for e in exts])


@extensions_bp.route('/available')
@login_required
def available():
    try:
        r = requests.get(f'{REGISTRY}/extensions.json', timeout=10)
        if r.status_code == 200:
            return jsonify(r.json())
    except requests.exceptions.Timeout:
        pass
    except requests.exceptions.ConnectionError:
        pass
    except requests.exceptions.RequestException:
        pass
    except Exception:
        pass
    return jsonify(FALLBACK)


@extensions_bp.route('/install', methods=['POST'])
@login_required
def install():
    data = request.json
    ext = Extension.query.filter_by(name=data.get('name')).first()
    if not ext:
        ext = Extension(
            name=data['name'],
            display_name=data.get('display_name', data['name']),
            description=data.get('description', ''),
            version=data.get('version', '1.0.0'),
            author=data.get('author', 'unknown'),
            installed=True,
            permissions=data.get('permissions', [])
        )
        db.session.add(ext)
    else:
        ext.installed = True
        ext.enabled = True
    db.session.commit()
    return jsonify({'message': f'{ext.display_name} installed', 'id': ext.id})


@extensions_bp.route('/uninstall', methods=['POST'])
@login_required
def uninstall():
    ext = Extension.query.get(request.json.get('id'))
    if ext:
        ext.installed = False
        ext.enabled = False
        db.session.commit()
    return jsonify({'message': 'Extension removed'})


@extensions_bp.route('/<ext_id>/toggle', methods=['POST'])
@login_required
def toggle(ext_id):
    ext = Extension.query.get(ext_id)
    if ext:
        ext.enabled = not ext.enabled
        db.session.commit()
    return jsonify({'enabled': ext.enabled if ext else False})


@extensions_bp.route('/<ext_id>/settings', methods=['PUT'])
@login_required
def update_settings(ext_id):
    ext = Extension.query.get(ext_id)
    if ext:
        ext.settings = {**ext.settings, **request.json.get('settings', {})}
        db.session.commit()
    return jsonify({'message': 'Settings updated'})
