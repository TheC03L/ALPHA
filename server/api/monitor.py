from flask import Blueprint, jsonify, request
from main import db
from models.models import Metric
from flask_login import login_required
from datetime import datetime, timedelta
import psutil, threading, time as _time

monitor_bp = Blueprint('monitor', __name__)
_started = False
NET_LAST = {'sent': 0, 'recv': 0, 'time': 0}

def _collect(app):
    with app.app_context():
        try:
            net = psutil.net_io_counters()
            now = _time.time()
            if NET_LAST['time'] > 0:
                elapsed = now - NET_LAST['time']
                sent_speed = (net.bytes_sent - NET_LAST['sent']) / elapsed if elapsed > 0 else 0
                recv_speed = (net.bytes_recv - NET_LAST['recv']) / elapsed if elapsed > 0 else 0
            else:
                sent_speed = 0
                recv_speed = 0
            NET_LAST['sent'] = net.bytes_sent
            NET_LAST['recv'] = net.bytes_recv
            NET_LAST['time'] = now

            disk = psutil.disk_usage('/')
            mem = psutil.virtual_memory()
            m = Metric(
                cpu_percent=psutil.cpu_percent(interval=0.5),
                memory_percent=mem.percent, memory_used=mem.used, memory_total=mem.total,
                disk_percent=disk.percent, disk_used=disk.used, disk_total=disk.total,
                net_sent=int(sent_speed), net_recv=int(recv_speed)
            )
            db.session.add(m)
            cutoff = datetime.utcnow() - timedelta(days=7)
            Metric.query.filter(Metric.timestamp < cutoff).delete()
            db.session.commit()
        except:
            db.session.rollback()

def start_collector(app):
    global _started
    if _started:
        return
    _started = True
    def _loop():
        while True:
            _collect(app)
            _time.sleep(60)
    t = threading.Thread(target=_loop, daemon=True)
    t.start()

@monitor_bp.route('/history')
@login_required
def metric_history():
    range_map = {'1h': 60, '6h': 360, '24h': 1440, '7d': 10080}
    r = request.args.get('range', '24h')
    limit = range_map.get(r, 1440)
    cutoff = datetime.utcnow() - timedelta(minutes=limit)
    metrics = Metric.query.filter(Metric.timestamp >= cutoff).order_by(Metric.timestamp.asc()).all()
    return jsonify([{
        'timestamp': m.timestamp.isoformat(),
        'cpu': m.cpu_percent, 'memory': m.memory_percent, 'disk': m.disk_percent,
        'memory_used': m.memory_used, 'memory_total': m.memory_total,
        'disk_used': m.disk_used, 'disk_total': m.disk_total,
        'net_sent': m.net_sent, 'net_recv': m.net_recv
    } for m in metrics])
