from flask import Blueprint, jsonify, request, send_file
from main import db
from models.models import BackupArchive
from flask_login import login_required, current_user
from datetime import datetime
import os, tarfile, io, json, shutil

backup_bp = Blueprint('backup', __name__)

BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BACKUP_DIR = os.path.join(BASE, 'storage', 'backups')
os.makedirs(BACKUP_DIR, exist_ok=True)

def _collect_files(include_storage=False):
    files = []
    db_path = os.path.join(BASE, 'instance', 'alpha.db')
    if os.path.exists(db_path):
        files.append((db_path, 'alpha.db'))
    env_path = os.path.join(BASE, '.env')
    if os.path.exists(env_path):
        files.append((env_path, '.env'))
    manifest = {
        'created_at': datetime.utcnow().isoformat(),
        'version': '1.0.0', 'includes_storage': include_storage
    }
    manifest_path = os.path.join(BASE, 'storage', 'backups', '_manifest.json')
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f)
    files.append((manifest_path, 'manifest.json'))
    if include_storage:
        storage_dir = os.path.join(BASE, 'storage')
        for root, dirs, fnames in os.walk(storage_dir):
            for fn in fnames:
                fp = os.path.join(root, fn)
                arcname = os.path.relpath(fp, BASE)
                files.append((fp, arcname))
    return files

@backup_bp.route('/create', methods=['POST'])
@login_required
def create_backup():
    data = request.json or {}
    include_storage = data.get('include_storage', False)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    fname = f"alpha_backup_{ts}.tar.gz"
    fpath = os.path.join(BACKUP_DIR, fname)

    files = _collect_files(include_storage)
    with tarfile.open(fpath, 'w:gz') as tar:
        for src, arcname in files:
            tar.add(src, arcname=arcname)

    size = os.path.getsize(fpath)
    arch = BackupArchive(filename=fname, filepath=fpath, size_bytes=size, includes_storage=include_storage, created_by=current_user.id)
    db.session.add(arch)
    db.session.commit()

    if os.path.exists(os.path.join(BASE, 'storage', 'backups', '_manifest.json')):
        os.remove(os.path.join(BASE, 'storage', 'backups', '_manifest.json'))

    return jsonify({'id': arch.id, 'filename': fname, 'size': size, 'message': 'Backup created'})

@backup_bp.route('/list')
@login_required
def list_backups():
    backups = BackupArchive.query.order_by(BackupArchive.created_at.desc()).all()
    return jsonify([{
        'id': b.id, 'filename': b.filename, 'size': b.size_bytes,
        'includes_storage': b.includes_storage, 'created_at': b.created_at.isoformat()
    } for b in backups])

@backup_bp.route('/download/<arch_id>')
@login_required
def download_backup(arch_id):
    arch = db.session.get(BackupArchive, arch_id)
    if not arch or not os.path.exists(arch.filepath):
        return jsonify({'error': 'Not found'}), 404
    return send_file(arch.filepath, as_attachment=True, download_name=arch.filename)

@backup_bp.route('/restore', methods=['POST'])
@login_required
def restore_backup():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    f = request.files['file']
    if not f.filename.endswith('.tar.gz'):
        return jsonify({'error': 'Must be a .tar.gz file'}), 400
    temp_path = os.path.join(BACKUP_DIR, '_restore_temp.tar.gz')
    f.save(temp_path)
    try:
        with tarfile.open(temp_path, 'r:gz') as tar:
            tar.extractall(path=BASE)
        os.remove(temp_path)
        return jsonify({'message': 'Restore complete. Server will restart.'})
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return jsonify({'error': str(e)}), 400

@backup_bp.route('/delete/<arch_id>', methods=['DELETE'])
@login_required
def delete_backup(arch_id):
    arch = db.session.get(BackupArchive, arch_id)
    if not arch:
        return jsonify({'error': 'Not found'}), 404
    if os.path.exists(arch.filepath):
        os.remove(arch.filepath)
    db.session.delete(arch)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
