
# Flask Web Framework

Flask is a lightweight WSGI web application framework. It is designed to make getting started quick and easy, with the ability to scale up to complex applications. It began as a simple wrapper around Werkzeug and Jinja and has become one of the most popular Python web application frameworks.

## Installation

```bash
pip install flask
```

## Hello World

```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run()
```

## Request and Response

```python
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/post', methods=['POST'])
def post_request():
    data = request.get_json()
    return jsonify(data)

if __name__ == '__main__':
    app.run()
```

## Templates

```python
from flask import Flask, render_template
app = Flask(__name__)

@app.route('/')
def hello_world():
    
    return render_template('index.html', name='Flask')
    if __name__ == '__main__':
        app.run()

        # index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flask</title>
</head>
<body>
    <h1>Hello {{ name }}</h1>
</body>
</html>
```

## Blueprints

```python
from flask import Flask, Blueprint

main_blueprint = Blueprint('main', __name__)

@main_blueprint.route('/')
def hello_world():
    return 'Hello, World!'

app = Flask(__name__)
app.register_blueprint(main_blueprint)

if __name__ == '__main__':
    app.run()
```

## Error Handling

```python
from flask import Flask, render_template, request, jsonify, abort
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404
    if __name__ == '__main__':
        app.run()

        # 404.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404</title>
</head>
<body>
    <h1>404</h1>
</body>
</html>
```

## Testing

```python
from flask import Flask, render_template, request, jsonify, abort
from unittest import TestCase
class TestFlask(TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.client = self.app.test_client()

    def test_hello_world(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'Hello, World!')

    def test_post_request(self):
        response = self.client.post('/post', json={'name': 'Flask'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {'name': 'Flask'})
        if __name__ == '__main__':
            app.run()
            # index.html
            <!DOCTYPE html> 
            <html lang="en"> 
            <head> 
                <meta charset="UTF-8"> 
                <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
                <title>Flask</title> 
            </head> 
            <body> 
                <h1>Hello Flask</h1> 
            </body> 
            </html>
            # 404.html
            <!DOCTYPE html> 
            <html lang="en"> 
            <head> 
                <meta charset="UTF-8"> 
                <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
                <title>404</title> 
            </head> 
            <body> 
                <h1>404</h1> 
            </body> 
            </html>
```



