from flask import Blueprint, jsonify, request, current_app
from main import db
from models.models import Download
from flask_login import login_required, current_user
from datetime import datetime
import os, threading, requests as req, time

downloads_bp = Blueprint('downloads', __name__)

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'storage', 'downloads')
os.makedirs(STORAGE_DIR, exist_ok=True)

def _worker(download_id, app):
    with app.app_context():
        d = db.session.get(Download, download_id)
        if not d:
            return
        try:
            resp = req.get(d.url, stream=True, timeout=30)
            resp.raise_for_status()
            total = int(resp.headers.get('content-length', 0))
            d.total_bytes = total
            db.session.commit()

            fname = d.filename or os.path.basename(d.url.split('?')[0]) or 'download'
            filepath = os.path.join(STORAGE_DIR, fname)
            d.file_path = filepath
            db.session.commit()

            downloaded = 0
            chunk_size = 8192
            start = time.time()
            with open(filepath, 'wb') as f:
                for chunk in resp.iter_content(chunk_size):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        d.downloaded_bytes = downloaded
                        elapsed = time.time() - start
                        if elapsed > 0:
                            d.speed = downloaded / elapsed
                        if downloaded % (chunk_size * 128) == 0:
                            db.session.commit()
            d.status = 'completed'
            d.downloaded_bytes = downloaded
            d.completed_at = datetime.utcnow()
            db.session.commit()
        except Exception as e:
            d.status = 'failed'
            d.error = str(e)
            db.session.commit()

@downloads_bp.route('')
@login_required
def list_downloads():
    dl = Download.query.filter_by(user_id=current_user.id).order_by(Download.created_at.desc()).all()
    return jsonify([{
        'id': d.id, 'url': d.url, 'filename': d.filename or os.path.basename(d.file_path or d.url.split('?')[0]),
        'status': d.status, 'total_bytes': d.total_bytes, 'downloaded_bytes': d.downloaded_bytes,
        'speed': d.speed, 'error': d.error, 'created_at': d.created_at.isoformat(),
        'completed_at': d.completed_at.isoformat() if d.completed_at else None
    } for d in dl])

@downloads_bp.route('', methods=['POST'])
@login_required
def start_download():
    data = request.json
    url = data.get('url', '').strip()
    if not url:
        return jsonify({'error': 'URL required'}), 400
    d = Download(user_id=current_user.id, url=url, filename=data.get('filename'))
    db.session.add(d)
    db.session.commit()
    t = threading.Thread(target=_worker, args=(d.id, current_app._get_current_object()), daemon=True)
    t.start()
    return jsonify({'id': d.id, 'message': 'Download started'}), 201

@downloads_bp.route('/<dl_id>')
@login_required
def get_download(dl_id):
    d = db.session.get(Download, dl_id)
    if not d or d.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({
        'id': d.id, 'url': d.url, 'filename': d.filename or os.path.basename(d.file_path or d.url),
        'status': d.status, 'total_bytes': d.total_bytes, 'downloaded_bytes': d.downloaded_bytes,
        'speed': d.speed, 'error': d.error, 'file_path': d.file_path,
        'created_at': d.created_at.isoformat(), 'completed_at': d.completed_at.isoformat() if d.completed_at else None
    })

@downloads_bp.route('/<dl_id>', methods=['DELETE'])
@login_required
def delete_download(dl_id):
    d = db.session.get(Download, dl_id)
    if not d or d.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    if d.file_path and os.path.exists(d.file_path):
        os.remove(d.file_path)
    db.session.delete(d)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
