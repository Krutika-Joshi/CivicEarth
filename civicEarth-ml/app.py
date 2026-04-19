from flask import Flask, request, jsonify
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import numpy as np
import io
import os

app = Flask(__name__)

# ✅ Load model once at startup (good practice)
model = MobileNetV2(weights='imagenet')


@app.route('/')
def home():
    return "ML Service is running"


@app.route('/predict', methods=['POST'])
def predict():
    # ✅ Error handling
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']

    try:
        # ✅ Read and preprocess image
        img_bytes = file.read()
        img = image.load_img(io.BytesIO(img_bytes), target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        # ✅ Prediction
        preds = model.predict(img_array)
        decoded = decode_predictions(preds, top=1)[0][0]

        label = decoded[1]
        confidence = float(decoded[2])

        # ✅ Category mapping
        if any(word in label for word in ["bag", "trash", "garbage", "bottle", "plastic", "waste", "ashcan", "trashcan", "dustbin"]):
            category = "garbage"

        elif any(word in label for word in ["water", "leak", "pipe", "drain", "flood"]):
            category = "water"

        elif any(word in label for word in ["road", "street", "highway", "pothole"]):
            category = "road"

        elif any(word in label for word in ["smoke", "pollution", "factory"]):
            category = "air"

        elif any(word in label for word in ["loud", "speaker", "noise"]):
            category = "noise"

        else:
            category = "other"

        # ✅ Response
        return jsonify({
            "original_label": label,
            "category": category,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ✅ IMPORTANT: Render-compatible run
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)