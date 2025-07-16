from flask import Flask, render_template, request, jsonify
import mysql.connector
from flask_cors import CORS  # For handling CORS

app = Flask(__name__)
CORS(app)  # This will allow all origins, adjust it based on your needs

# Connect to your MySQL database
def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host='localhost',         # Change to your MySQL host if needed
            user='root',              # Your MySQL username
            password='root@123',      # Your MySQL password
            database='gadgetrepair'   # The name of your database
        )
        return connection
    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

# Route to display the Book a Slot page
@app.route('/book_slot', methods=['GET'])
def book_slot():
    return render_template('bookSlot.html')

# Route to get shops based on pincode
@app.route('/get_shops', methods=['POST'])
def get_shops():
    pincode = request.json.get('pincode')  # Receive pincode from the request
    if not pincode:
        return jsonify({"error": "Pincode is required"}), 400

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Failed to connect to the database"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Query to get shops with the same pincode
        cursor.execute("SELECT shop_id, shop_name, address FROM shop WHERE pin_code = %s", (pincode,))
        shops = cursor.fetchall()

        if not shops:
            return jsonify({"message": "No shops found for this pincode"}), 404

        return jsonify({"shops": shops}), 200
    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({"error": "Failed to retrieve shops"}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True)
