from displacy_service.server import APP, get_model

# Pre-load English model only, to save memory
get_model('en_core_web_sm')

if __name__ == '__main__':
    from wsgiref import simple_server
    httpd = simple_server.make_server('127.0.0.1', 8000, APP)
    httpd.serve_forever()

