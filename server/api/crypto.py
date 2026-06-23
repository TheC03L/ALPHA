from flask import Blueprint, jsonify, request
from main import db
from flask_login import login_required, current_user
import os, base64, hashlib

crypto_bp = Blueprint('crypto', __name__)

STORAGE_BASE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'storage')

def _derive_key(password: str, salt: bytes) -> bytes:
    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000, dklen=32)

@crypto_bp.route('/encrypt', methods=['POST'])
@login_required
def encrypt_file():
    data = request.json
    path = data.get('path', '')
    password = data.get('password', '')
    if not path or not password:
        return jsonify({'error': 'path and password required'}), 400
    full = os.path.abspath(os.path.join(STORAGE_BASE, path.lstrip('/')))
    if not full.startswith(STORAGE_BASE) or not os.path.isfile(full):
        return jsonify({'error': 'Access denied or file not found'}), 403
    try:
        from cryptography.fernet import Fernet
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        salt = os.urandom(16)
        kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=100000)
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        f = Fernet(key)
        with open(full, 'rb') as fh:
            plaintext = fh.read()
        encrypted = f.encrypt(plaintext)
        out_path = full + '.alpha-encrypted'
        with open(out_path, 'wb') as fh:
            fh.write(salt + encrypted)
        os.remove(full)
        return jsonify({'message': 'Encrypted', 'file': os.path.relpath(out_path, STORAGE_BASE)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@crypto_bp.route('/decrypt', methods=['POST'])
@login_required
def decrypt_file():
    data = request.json
    path = data.get('path', '')
    password = data.get('password', '')
    if not path or not password:
        return jsonify({'error': 'path and password required'}), 400
    full = os.path.abspath(os.path.join(STORAGE_BASE, path.lstrip('/')))
    if not full.startswith(STORAGE_BASE) or not os.path.isfile(full):
        return jsonify({'error': 'Access denied or file not found'}), 403
    if not full.endswith('.alpha-encrypted'):
        return jsonify({'error': 'Not an encrypted file'}), 400
    try:
        from cryptography.fernet import Fernet, InvalidToken
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        with open(full, 'rb') as fh:
            salt = fh.read(16)
            ciphertext = fh.read()
        kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=100000)
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        f = Fernet(key)
        plaintext = f.decrypt(ciphertext)
        out_path = full.replace('.alpha-encrypted', '')
        with open(out_path, 'wb') as fh:
            fh.write(plaintext)
        os.remove(full)
        return jsonify({'message': 'Decrypted', 'file': os.path.relpath(out_path, STORAGE_BASE)})
    except InvalidToken:
        return jsonify({'error': 'Wrong password'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
