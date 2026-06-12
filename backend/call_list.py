import importlib, traceback
app = importlib.import_module('backend.app')
try:
    res = app.list_districts()
    print('result type:', type(res))
    print(res)
except Exception as e:
    traceback.print_exc()
    print('EXCEPTION', e)
