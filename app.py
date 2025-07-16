from flask import Flask, render_template, request, jsonify, redirect, session, send_from_directory
import mysql.connector
from flask_cors import CORS
import os
from functools import wraps
from datetime import timedelta  

app = Flask(__name__, template_folder='html')
CORS(app)


app.secret_key = 'your_secret_key'

app.config['SESSION_PERMANENT'] = False
app.config['SESSION_COOKIE_DURATION'] = None
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = False
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

@app.before_request
def make_session_non_permanent():
    session.permanent = False 


# -------------------- STATIC FILES --------------------

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(app.root_path, 'css'), filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(app.root_path, 'js'), filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(os.path.join(app.root_path, 'images'), filename)


# -------------------- DATABASE --------------------

conn = mysql.connector.connect(
    host='localhost',
    user='root',
    password='root@123',
    database='gadgetrepair_normalized'
)
cursor = conn.cursor(dictionary=True)


# -------------------- AUTH DECORATOR --------------------

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'customer_id' not in session:
            return redirect('/loginPage?next=' + request.path.lstrip('/'))
        return f(*args, **kwargs)
    return decorated_function

# -------------------- ROUTES --------------------

@app.route('/')
def index():
    return render_template('home.html')

@app.route('/home.html')
def home_customer():
    return render_template('home.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/services')
def services():
    return render_template('services.html')

@app.route('/shopHome')
def home_shop():
    if 'shop_id' in session:
        return render_template('shopHome.html')
    return redirect('/loginPage')


# -------------------- LOGIN / AUTH --------------------

@app.route('/loginPage')
def login_customer_page():
    next_page = request.args.get('next', '')
    return render_template('login.html', next=next_page)

from flask import request, session, jsonify

@app.route('/login', methods=['POST'])
def login_customer():
    data = request.get_json()
    email = data['email']
    password = data['password']
    next_page = data.get('next', '')

    cursor.execute("SELECT * FROM customer WHERE email=%s AND password=%s", (email, password))
    user = cursor.fetchone()

    if user:
        session.permanent = False  
        session['customer_id'] = user['customer_id']
        redirect_url = f'/{next_page}' if next_page else '/home.html'
        return jsonify({'success': True, 'redirect': redirect_url})
    else:
        return jsonify({'success': False, 'message': 'Invalid email or password'})


@app.route('/shopLogin', methods=['POST'])
def login_shop():
    data = request.get_json()
    email = data['email']
    password = data['password']

    cursor.execute("SELECT * FROM shop WHERE email=%s AND password=%s", (email, password))
    user = cursor.fetchone()

    if user:
        session.permanent = True 
        session['shop_id'] = user['shop_id']
        return jsonify({'success': True, 'redirect': '/shopHome'})
    else:
        return jsonify({'success': False})

@app.route('/shopLogin', methods=['GET'])
def shop_login_page():
    return render_template('shopLogin.html')

@app.route('/check_login', methods=['GET'])
def check_login():
    if 'customer_id' in session:
        return jsonify({"logged_in": True})
    else:
        return jsonify({"logged_in": False})

@app.route('/logout')
def logout():
    session.pop('customer_id', None)
    session.pop('shop_id', None)
    return redirect('/loginPage')


# -------------------- BOOK SLOT --------------------

@app.route('/bookslot')
@login_required
def bookslot():
    customer_id = session['customer_id']

    # Fetch customer details
    cursor.execute("SELECT name, email, phone_no, address FROM customer WHERE customer_id = %s", (customer_id,))
    customer = cursor.fetchone()

    cursor.execute("""
    SELECT s.shop_id, s.shop_name, s.email, s.phone_no, s.owner_name,
           a.address, a.city, a.pin_code,
           GROUP_CONCAT(DISTINCT sv.service_name SEPARATOR ', ') AS services_offered
    FROM shop s
    JOIN address a ON s.address_id = a.address_id
    LEFT JOIN shop_services ss ON s.shop_id = ss.shop_id
    LEFT JOIN service sv ON ss.service_id = sv.service_id
    GROUP BY s.shop_id
    """)
    shops = cursor.fetchall()

    return render_template('bookslot.html', customer=customer, shops=shops)



# -------------------- SIGNUP --------------------

@app.route('/signin.html', methods=['GET', 'POST'])
def signin():
    if request.method == 'POST':
        data = request.get_json()
        name = data['name']
        email = data['email']
        password = data['password']
        address = data['address']
        phone = data['phone']

        try:
            cursor.execute(
                "INSERT INTO customer (name, email, password, address, phone_no) VALUES (%s, %s, %s, %s, %s)",
                (name, email, password, address, phone)
            )
            conn.commit()
            return jsonify({'message': 'Registration successful!'})
        except Exception as e:
            print("Registration Error:", e)
            return jsonify({'message': 'Registration failed'}), 500

    return render_template('signin.html')

@app.route('/signinShop', methods=['GET', 'POST'])
def signinShop():
    if request.method == 'POST':
        data = request.get_json()
        name = data['name']
        email = data['email']
        password = data['password']
        address = data['address']
        phone = data['phone']

        try:
            cursor.execute(
                "INSERT INTO shop (shop_name, email, password, address, phone_no) VALUES (%s, %s, %s, %s, %s)",
                (name, email, password, address, phone)
            )

            conn.commit()
            return jsonify({'message': 'Registration successful!'})
        except Exception as e:
            print("Registration Error:", e)
            return jsonify({'message': 'Registration failed'}), 500

    return render_template('signinShop.html')

@app.route('/registerShop', methods=['POST'])
def register_shop():
    data = request.get_json()
    owner_name = data['owner_name']
    shop_name = data['shop_name']
    email = data['email']
    password = data['password']
    phone_no = data['phone_no']
    address_text = data['address']
    shop_type = data['shop_type']  # You may now ignore this if not stored
    services_offered = data['services_offered']  # Comma-separated string
    city = data['city']
    pin_code = data['pin_code']

    try:
        # 1. Insert into address table
        cursor.execute("""
            INSERT INTO address (address, city, pin_code)
            VALUES (%s, %s, %s)
        """, (address_text, city, pin_code))
        address_id = cursor.lastrowid

        # 2. Insert into shop table
        cursor.execute("""
            INSERT INTO shop (owner_name, shop_name, email, password, phone_no, address_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (owner_name, shop_name, email, password, phone_no, address_id))
        shop_id = cursor.lastrowid

        # 3. Insert services and map them in junction table
        services = [s.strip() for s in services_offered.split(',')]
        for service in services:
            cursor.execute("SELECT service_id FROM service WHERE service_name = %s", (service,))
            result = cursor.fetchone()

            if result:
                service_id = result['service_id']
            else:
                cursor.execute("INSERT INTO service (service_name) VALUES (%s)", (service,))
                service_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO shop_services (shop_id, service_id)
                VALUES (%s, %s)
            """, (shop_id, service_id))

        conn.commit()
        return jsonify({'message': 'Shop registered successfully!'})

    except mysql.connector.IntegrityError as e:
        print("DB Error:", e)
        return jsonify({'message': 'This email is already registered.'}), 400

    except Exception as e:
        print("Registration Error:", e)
        return jsonify({'message': 'Registration failed!'}), 500

@app.route('/confirmBooking', methods=['POST'])
@login_required
def confirm_booking():
    data = request.get_json()
    customer_id = session['customer_id']
    shop_id = data.get('shop_id')
    gadget_type = data.get('gadgetType')
    model = data.get('model')
    problem_description = data.get('problemDescription')
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    pincode = data.get('pincode')
    address = data.get('address')

    try:
        # Step 1: Insert into gadget
        cursor.execute("""
            INSERT INTO gadget (customer_id, gadget_type, model, issue_description)
            VALUES (%s, %s, %s, %s)
        """, (customer_id, gadget_type, model, problem_description))
        conn.commit()
        gadget_id = cursor.lastrowid

        # Step 2: Insert into repair_request
        cursor.execute("""
            INSERT INTO repair_request (gadget_id, shop_id, status)
            VALUES (%s, %s, %s)
        """, (gadget_id, shop_id, 'Pending'))
        conn.commit()

        # Step 3: Insert into bookings (reduced fields)
        cursor.execute("""
            INSERT INTO bookings (customer_id, shop_id, status, name, email, phone, pincode, address)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (customer_id, shop_id, 'Pending', name, email, phone, pincode, address))
        conn.commit()

        return jsonify({'success': True})
    except Exception as e:
        print("Booking Error:", e)
        return jsonify({'success': False}), 500


@app.route('/getBookings', methods=['GET'])
def get_bookings():
    if 'shop_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    shop_id = session['shop_id']
    try:
        cursor.execute("""
            SELECT 
                b.booking_id,
                b.name AS customer_name,
                b.email,
                b.phone,
                b.status AS booking_status,
                g.gadget_type,
                g.model,
                g.issue_description,
                r.status AS repair_status,
                r.collect_date,
                r.completion_date
            FROM bookings b
            JOIN gadget g ON b.customer_id = g.customer_id
            JOIN repair_request r ON g.gadget_id = r.gadget_id
            WHERE b.shop_id = %s
            ORDER BY b.created_at DESC
        """, (shop_id,))
        bookings = cursor.fetchall()
        return jsonify(bookings)
    except Exception as e:
        print("Error fetching bookings:", e)
        return jsonify({'error': 'Failed to fetch bookings'}), 500


# -------------------- MAIN --------------------

if __name__ == '__main__':
    app.run(debug=True)