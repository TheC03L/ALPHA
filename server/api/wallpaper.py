from flask import Blueprint, request, jsonify, send_from_directory
from flask_login import login_required
import os
import uuid

wallpaper_bp = Blueprint('wallpaper', __name__)
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'wallpapers')
os.makedirs(UPLOAD_DIR, exist_ok=True)

@wallpaper_bp.route('/upload', methods=['POST'])
@login_required
def upload_wallpaper():
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    f = request.files['file']
    ext = f.filename.rsplit('.', 1)[-1].lower() if '.' in f.filename else 'png'
    if ext not in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']:
        return jsonify({'error': 'Invalid file type'}), 400
    name = f"{uuid.uuid4().hex}.{ext}"
    f.save(os.path.join(UPLOAD_DIR, name))
    return jsonify({'url': f'/api/wallpaper/file/{name}'})

@wallpaper_bp.route('/file/<name>')
def serve_wallpaper(name):
    return send_from_directory(UPLOAD_DIR, name)

@wallpaper_bp.route('/list')
@login_required
def list_wallpapers():
    files = []
    for f in os.listdir(UPLOAD_DIR):
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg')):
            files.append({'name': f, 'url': f'/api/wallpaper/file/{f}'})
    return jsonify(files)

@wallpaper_bp.route('/delete/<name>', methods=['DELETE'])
@login_required
def delete_wallpaper(name):
    path = os.path.join(UPLOAD_DIR, name)
    if os.path.exists(path):
        os.remove(path)
    return jsonify({'message': 'Deleted'})
