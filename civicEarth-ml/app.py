from flask import Flask, request, jsonify
from tensorflow.keras.applications.mobilenet_v2 import MobileNetV2, preprocess_input, decode_predictions
from tensorflow.keras.preprocessing import image
import numpy as np
import io

app = Flask(__name__)

# Load pre-trained CNN model
model = MobileNetV2(weights='imagenet')

@app.route('/predict', methods=['POST'])
def predict():
    #  Error handling (important)
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']

    try:
        # Read and process image
        img_bytes = file.read()
        img = image.load_img(io.BytesIO(img_bytes), target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = preprocess_input(img_array)

        # Prediction
        preds = model.predict(img_array)
        decoded = decode_predictions(preds, top=1)[0][0]

        label = decoded[1]
        confidence = float(decoded[2])

        #  Mapping to your CivicEarth categories
        if any(word in label for word in ["bag", "trash", "garbage", "bottle", "plastic", "waste", "ashcan","trashcan","dustbin"]):
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
        
        #  Confidence check 
        # if confidence < 0.4:
        #     category = "other"

        # Final response
        return jsonify({
            "original_label": label,
            "category": category,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(port=5001, debug=True)