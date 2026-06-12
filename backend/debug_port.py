import socket, sys
s=socket.socket()
s.settimeout(2)
try:
    s.connect(('127.0.0.1',8000))
    print('ok')
except Exception as e:
    print('err', e)
finally:
    s.close()
