"""WiFi and hotspot management for ALPHA."""
from flask import Blueprint, jsonify, request
from flask_login import login_required
import subprocess, json, re, os

wifi_bp = Blueprint('wifi', __name__)

NMCLI = '/usr/bin/nmcli'
HOSTAPD_CONF = '/etc/hostapd/hostapd.conf'
DNSMASQ_CONF = '/etc/dnsmasq.conf'

def _run(cmd, timeout=10):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.stderr.strip(), r.returncode
    except FileNotFoundError:
        return '', 'nmcli not installed', 127
    except subprocess.TimeoutExpired:
        return '', 'timeout', 124

@wifi_bp.route('/status')
@login_required
def wifi_status():
    """Current WiFi connection and hotspot state."""
    out, _, _ = _run([NMCLI, '-t', '-f', 'DEVICE,TYPE,STATE,CONNECTION', 'device', 'status'])
    interfaces = {'wifi': None, 'ap': None}
    for line in out.split('\n'):
        parts = line.split(':')
        if len(parts) >= 4:
            dev, typ, state, conn = parts[0], parts[1], parts[2], parts[3]
            if typ == 'wifi' and state == 'connected':
                interfaces['wifi'] = {'device': dev, 'connection': conn}
            if typ == 'wifi' and 'ap' in state.lower():
                interfaces['ap'] = {'device': dev}

    # Get connection details
    details = {'ssid': '', 'ip': '', 'signal': 0, 'mode': 'client'}
    if interfaces['wifi']:
        dev = interfaces['wifi']['device']
        out2, _, _ = _run([NMCLI, '-t', '-f', 'ACTIVE,SSID,SIGNAL', 'device', 'wifi', 'list'])
        for line in out2.split('\n'):
            parts = line.split(':')
            if len(parts) >= 3 and parts[0] == 'yes':
                details['ssid'] = parts[1]
                details['signal'] = int(parts[2])
                break
        out3, _, _ = _run([NMCLI, '-t', '-f', 'IP4.ADDRESS', 'device', 'show', dev])
        if ':' in out3: details['ip'] = out3.split(':')[1]
    elif interfaces['ap']:
        dev = interfaces['ap']['device']
        details['mode'] = 'hotspot'
        out3, _, _ = _run([NMCLI, '-t', '-f', 'IP4.ADDRESS', 'device', 'show', dev])
        if ':' in out3: details['ip'] = out3.split(':')[1]
        out4, _, _ = _run([NMCLI, '-t', '-f', '802-11-wireless.ssid', 'connection', 'show', '--active'])
        if out4: details['ssid'] = out4

    return jsonify({
        'connected': bool(interfaces['wifi']) or bool(interfaces['ap']),
        'mode': details['mode'],
        'ssid': details['ssid'],
        'ip': details['ip'],
        'signal': details['signal'],
        'hotspot_active': bool(interfaces['ap']),
    })

@wifi_bp.route('/scan')
@login_required
def wifi_scan():
    """Scan for nearby WiFi networks."""
    out, err, code = _run(['sudo', NMCLI, '-t', '-f', 'SSID,SIGNAL,SECURITY', 'device', 'wifi', 'list'], timeout=15)
    if code != 0:
        return jsonify({'error': err or 'scan failed', 'networks': []}), 400
    networks = []
    seen = set()
    for line in out.split('\n'):
        parts = line.split(':')
        if len(parts) >= 3 and parts[0] and parts[0] != 'SSID':
            ssid = parts[0]
            if ssid not in seen:
                seen.add(ssid)
                networks.append({
                    'ssid': ssid,
                    'signal': int(parts[1]) if parts[1].isdigit() else 0,
                    'security': parts[2] if parts[2] != '' else 'Open'
                })
    networks.sort(key=lambda n: n['signal'], reverse=True)
    return jsonify({'networks': networks})

@wifi_bp.route('/connect', methods=['POST'])
@login_required
def wifi_connect():
    """Connect to a WiFi network. Disables hotspot if active."""
    data = request.json
    ssid = data.get('ssid', '')
    password = data.get('password', '')
    if not ssid:
        return jsonify({'error': 'SSID required'}), 400

    # Turn off hotspot first
    _run(['sudo', NMCLI, 'connection', 'down', 'ALPHA-Hotspot'], timeout=5)

    # Connect
    if password:
        out, err, code = _run(['sudo', NMCLI, 'device', 'wifi', 'connect', ssid, 'password', password], timeout=30)
    else:
        out, err, code = _run(['sudo', NMCLI, 'device', 'wifi', 'connect', ssid], timeout=30)

    if code == 0:
        return jsonify({'message': f'Connected to {ssid}'})
    return jsonify({'error': err or 'connection failed'}), 400

@wifi_bp.route('/hotspot/on', methods=['POST'])
@login_required
def hotspot_on():
    """Create a hotspot access point."""
    data = request.json
    ssid = data.get('ssid', 'ALPHA-Setup')
    password = data.get('password', 'alphasetup')

    # Create hotspot connection if it doesn't exist
    out, _, _ = _run([NMCLI, 'connection', 'show', 'ALPHA-Hotspot'])
    if 'not found' in out.lower():
        _run(['sudo', NMCLI, 'connection', 'add', 'type', 'wifi',
              'ifname', 'wlan0', 'con-name', 'ALPHA-Hotspot', 'autoconnect', 'no',
              '802-11-wireless.mode', 'ap',
              '802-11-wireless.ssid', ssid,
              '802-11-wireless-security.key-mgmt', 'wpa-psk',
              '802-11-wireless-security.psk', password,
              'ipv4.method', 'shared'], timeout=10)

    # Bring it up
    out, err, code = _run(['sudo', NMCLI, 'connection', 'up', 'ALPHA-Hotspot'], timeout=15)
    if code == 0:
        return jsonify({'message': f'Hotspot "{ssid}" active', 'ssid': ssid, 'password': password})
    return jsonify({'error': err or 'hotspot failed'}), 400

@wifi_bp.route('/hotspot/off', methods=['POST'])
@login_required
def hotspot_off():
    """Turn off hotspot, re-enable client Wi-Fi."""
    _run(['sudo', NMCLI, 'connection', 'down', 'ALPHA-Hotspot'], timeout=5)
    return jsonify({'message': 'Hotspot stopped'})
