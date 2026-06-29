from flask import Blueprint, jsonify, request
from main import db
from models.models import Device, Notification
from flask_login import login_required, current_user
from datetime import datetime, timezone
import subprocess
import re
import socket
import time

devices_bp = Blueprint('devices', __name__)

DEVICE_TYPES = [
    {'id': 'server', 'label': 'Server'},
    {'id': 'raspberry-pi', 'label': 'Raspberry Pi'},
    {'id': 'desktop', 'label': 'Desktop'},
    {'id': 'laptop', 'label': 'Laptop'},
    {'id': 'phone', 'label': 'Phone'},
    {'id': 'tablet', 'label': 'Tablet'},
    {'id': 'esp32', 'label': 'ESP32/ESP8266'},
    {'id': 'arduino', 'label': 'Arduino'},
    {'id': 'light', 'label': 'Light'},
    {'id': 'switch', 'label': 'Switch'},
    {'id': 'sensor', 'label': 'Sensor'},
    {'id': 'motion-sensor', 'label': 'Motion Sensor'},
    {'id': 'camera', 'label': 'Camera'},
    {'id': 'lock', 'label': 'Lock'},
    {'id': 'thermostat', 'label': 'Thermostat'},
    {'id': 'media-player', 'label': 'Media Player'},
    {'id': 'tv', 'label': 'TV'},
    {'id': 'speaker', 'label': 'Speaker'},
    {'id': 'fan', 'label': 'Fan'},
    {'id': 'vacuum', 'label': 'Vacuum'},
    {'id': 'climate', 'label': 'Climate'},
    {'id': 'humidifier', 'label': 'Humidifier'},
    {'id': 'cover', 'label': 'Cover/Blind'},
    {'id': 'printer', 'label': 'Printer'},
    {'id': 'nas', 'label': 'NAS'},
    {'id': 'router', 'label': 'Router'},
    {'id': 'network', 'label': 'Network Device'},
    {'id': 'unknown', 'label': 'Unknown'},
]


def _serialize_device(d, include_seconds_ago=True):
    data = {
        'id': d.id, 'name': d.name, 'type': d.device_type,
        'ip': d.ip_address, 'mac': d.mac_address,
        'status': d.status,
        'last_seen': d.last_seen.isoformat() if d.last_seen else None,
        'ip_address': d.ip_address,
    }
    if include_seconds_ago and d.last_seen:
        now = datetime.now(timezone.utc)
        last = d.last_seen.replace(tzinfo=timezone.utc) if d.last_seen.tzinfo is None else d.last_seen
        data['seconds_ago'] = int((now - last).total_seconds())
    else:
        data['seconds_ago'] = None
    return data


@devices_bp.route('/')
@login_required
def list_devices():
    devices = Device.query.order_by(Device.last_seen.desc()).all()
    return jsonify([_serialize_device(d) for d in devices])


@devices_bp.route('/types')
@login_required
def list_device_types():
    return jsonify(DEVICE_TYPES)


@devices_bp.route('/add', methods=['POST'])
@login_required
def add_device():
    data = request.json
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Name required'}), 400
    device = Device(
        name=name,
        device_type=data.get('type', 'unknown'),
        ip_address=data.get('ip', ''),
        mac_address=data.get('mac', ''),
        status='approved',
        last_seen=datetime.utcnow()
    )
    db.session.add(device)
    db.session.commit()
    return jsonify({'message': 'Device added', 'id': device.id}), 201


@devices_bp.route('/scan', methods=['POST'])
@login_required
def scan_devices():
    discovered = 0
    addresses = set()

    try:
        result = subprocess.run(
            ['sudo', 'nmap', '-sn', '192.168.1.0/24'],
            capture_output=True, text=True, timeout=60
        )
        for line in result.stdout.split('\n'):
            match = re.search(r'Nmap scan report for .+?\((\d+\.\d+\.\d+\.\d+)\)', line)
            if match:
                addresses.add(match.group(1))
    except Exception:
        pass

    if not addresses:
        try:
            result = subprocess.run(['arp', '-a'], capture_output=True, text=True, timeout=10)
            for line in result.stdout.split('\n'):
                match = re.search(r'\((\d+\.\d+\.\d+\.\d+)\)\s+at\s+([0-9a-f:]+)', line, re.I)
                if match:
                    addresses.add(match.group(1))
        except Exception:
            pass

    for ip in addresses:
        try:
            host = socket.gethostbyaddr(ip)[0]
        except Exception:
            host = f'Device-{ip}'

        try:
            result = subprocess.run(['arp', '-n', ip], capture_output=True, text=True, timeout=5)
            mac_match = re.search(r'([0-9a-f:]{17})', result.stdout, re.I)
            mac = mac_match.group(1) if mac_match else ''
        except Exception:
            mac = ''

        if mac and not Device.query.filter_by(mac_address=mac).first():
            device_type = 'unknown'
            if 'raspberry' in host.lower() or 'pi' in host.lower():
                device_type = 'raspberry-pi'
            elif 'esp' in host.lower():
                device_type = 'esp32'
            elif 'phone' in host.lower() or 'iphone' in host.lower() or 'android' in host.lower():
                device_type = 'phone'
            device = Device(
                name=host, device_type=device_type,
                ip_address=ip, mac_address=mac,
                status='pending', last_seen=datetime.utcnow()
            )
            db.session.add(device)
            discovered += 1

    if discovered > 0:
        try:
            admin_notif = Notification(
                user_id=current_user.id, title='New Devices Discovered',
                message=f'{discovered} new device(s) found. Review and approve them.',
                notification_type='system'
            )
            db.session.add(admin_notif)
        except Exception:
            pass

    db.session.commit()
    return jsonify({'message': 'Scan complete', 'discovered': discovered})


@devices_bp.route('/<device_id>')
@login_required
def get_device(device_id):
    device = Device.query.get(device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    return jsonify(_serialize_device(device))


@devices_bp.route('/<device_id>/ping', methods=['POST'])
@login_required
def ping_device(device_id):
    device = Device.query.get(device_id)
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    if not device.ip_address:
        return jsonify({'error': 'Device has no IP address'}), 400
    try:
        start = time.time()
        subprocess.run(
            ['ping', '-c', '1', '-W', '3', device.ip_address],
            capture_output=True, timeout=5
        )
        elapsed = int((time.time() - start) * 1000)
        device.last_seen = datetime.utcnow()
        db.session.commit()
        return jsonify({'reachable': True, 'latency_ms': elapsed, 'ip': device.ip_address})
    except Exception:
        return jsonify({'reachable': False, 'latency_ms': None, 'ip': device.ip_address})


@devices_bp.route('/<device_id>/approve', methods=['POST'])
@login_required
def approve_device(device_id):
    device = Device.query.get(device_id)
    if device:
        device.status = 'approved'
        db.session.commit()
    return jsonify({'message': 'Device approved'})


@devices_bp.route('/<device_id>/deny', methods=['POST'])
@login_required
def deny_device(device_id):
    device = Device.query.get(device_id)
    if device:
        device.status = 'denied'
        db.session.commit()
    return jsonify({'message': 'Device denied'})


@devices_bp.route('/<device_id>/rename', methods=['PUT'])
@login_required
def rename_device(device_id):
    device = Device.query.get(device_id)
    if device:
        device.name = request.json.get('name', device.name)
        db.session.commit()
    return jsonify({'message': 'Device renamed'})


@devices_bp.route('/<device_id>', methods=['DELETE'])
@login_required
def delete_device(device_id):
    device = Device.query.get(device_id)
    if device:
        db.session.delete(device)
        db.session.commit()
    return jsonify({'message': 'Device removed'})


@devices_bp.route('/pending')
@login_required
def pending_devices():
    devices = Device.query.filter_by(status='pending').all()
    return jsonify([{
        'id': d.id, 'name': d.name, 'type': d.device_type,
        'ip': d.ip_address, 'mac': d.mac_address,
        'ip_address': d.ip_address,
        'last_seen': d.last_seen.isoformat() if d.last_seen else None,
        'seconds_ago': int((datetime.now(timezone.utc) - d.last_seen.replace(tzinfo=timezone.utc)).total_seconds())
        if d.last_seen else None
    } for d in devices])
