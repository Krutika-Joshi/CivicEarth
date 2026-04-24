from flask import Flask, request, jsonify
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import numpy as np
import io
import json

import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppresses INFO and WARNING logs


app = Flask(__name__)

# ✅ Load model once
model = MobileNetV2(weights='imagenet')
print("✅ Model loaded and service ready!")



@app.route('/')
def home():
    return "ML Service is running"


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']

    # ✅ Get title from backend (IMPORTANT)
    raw_title = request.form.get("title", "")
    title = json.loads(raw_title) if raw_title else ""
    title = title.lower()

    print("TITLE RECEIVED:", title)

    try:
        # ✅ Read and preprocess image
        img_bytes = file.read()
        img = image.load_img(io.BytesIO(img_bytes), target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        # ✅ Prediction
        preds = model.predict(img_array)
        decoded = decode_predictions(preds, top=3)[0]

        labels = [item[1] for item in decoded]
        confidences = [float(item[2]) for item in decoded]

        top_label = labels[0]
        top_conf = confidences[0]

        print("Top labels:", labels)
        print("Confidence:", top_conf)

        # =========================
        # 🔥 STEP 1: TITLE-BASED (PRIORITY)
        # =========================
        if "water" in title or "leak" in title or "sewage" in title:
            category = "water"

        elif "garbage" in title or "dump" in title or "waste" in title:
            category = "garbage"

        elif "road" in title or "pothole" in title:
            category = "road"

        elif "smoke" in title or "pollution" in title:
            category = "air"

        elif "noise" in title:
            category = "noise"

        # =========================
        # 🔥 STEP 2: ML FALLBACK
        # =========================
        else:
            all_labels = " ".join(labels)

            if any(word in all_labels for word in [
                "bag", "trash", "garbage", "bottle", "plastic",
                "bin", "dustbin", "container", "packet", "bucket"
            ]):
                category = "garbage"

            elif any(word in all_labels for word in [
                "water", "pipe", "drain", "flood", "river", "canoe"
            ]):
                category = "water"

            elif any(word in all_labels for word in [
                "road", "street", "highway", "pavement"
            ]):
                category = "road"

            elif any(word in all_labels for word in [
                "smoke", "pollution", "factory", "chimney"
            ]):
                category = "air"

            elif any(word in all_labels for word in [
                "speaker", "loud", "noise"
            ]):
                category = "noise"

            else:
                category = "garbage"  # 👈 NO "other" anymore

        # ✅ Final response
        return jsonify({
            "original_label": top_label,
            "category": category,
            "confidence": top_conf
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
