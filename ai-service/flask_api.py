from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import traceback
import uuid

from app import (
    process_user_input,
    reset_conversation,
    get_system_status,
    load_image_models,
    load_chat_models,
    PETS_WITH_IMAGE_SUPPORT,
    ALL_PETS
)

app = Flask(__name__)
CORS(app)

# Configuration
UPLOAD_FOLDER = 'temp_uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    status = get_system_status()
    return jsonify({
        'status': 'healthy',
        'service': 'VetAI Diagnosis Service',
        'image_models_loaded': status['image_models']['loaded'],
        'chat_models_loaded': status['chat_models']['loaded'],
        'supported_pets': status['supported_pets']
    }), 200


@app.route('/api/predict/image', methods=['POST'])
def predict_image():
    """
    Image-based diagnosis endpoint
    Supports: cat, dog, cattle
    
    Form data:
        - file: image file
        - animal_type: "cat", "dog", or "cattle"
    """
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        animal_type = request.form.get('animal_type', '').lower()
        
        # Validate animal type
        if not animal_type:
            return jsonify({
                'success': False,
                'error': 'animal_type is required'
            }), 400
        
        if animal_type not in PETS_WITH_IMAGE_SUPPORT:
            return jsonify({
                'success': False,
                'error': f'Image analysis only supports: {", ".join(PETS_WITH_IMAGE_SUPPORT)}'
            }), 400
        
        # Validate file
        if not file or file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Empty file'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': f'Invalid file type. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        try:
            file.save(filepath)
            
            # Process image
            result = process_user_input('image', filepath, animal_type)
            
            # Clean up
            if os.path.exists(filepath):
                os.remove(filepath)
            
            # Return result
            if result.get('success'):
                return jsonify(result), 200
            else:
                return jsonify(result), 400
        
        except Exception as e:
            # Clean up on error
            if os.path.exists(filepath):
                os.remove(filepath)
            raise e
    
    except Exception as e:
        print(f"Error in image prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """
    Batch image prediction endpoint
    For multiple images of the same animal
    
    Form data:
        - files: multiple image files
        - animal_type: "cat", "dog", or "cattle"
    """
    try:
        if 'files' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No files provided'
            }), 400
        
        files = request.files.getlist('files')
        animal_type = request.form.get('animal_type', '').lower()
        
        if animal_type not in PETS_WITH_IMAGE_SUPPORT:
            return jsonify({
                'success': False,
                'error': f'Image analysis only supports: {", ".join(PETS_WITH_IMAGE_SUPPORT)}'
            }), 400
        
        results = []
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4()}_{filename}"
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
                
                try:
                    file.save(filepath)
                    result = process_user_input('image', filepath, animal_type)
                    result['filename'] = file.filename
                    results.append(result)
                    
                    if os.path.exists(filepath):
                        os.remove(filepath)
                
                except Exception as e:
                    results.append({
                        'success': False,
                        'filename': file.filename,
                        'error': str(e)
                    })
                    if os.path.exists(filepath):
                        os.remove(filepath)
            else:
                results.append({
                    'success': False,
                    'filename': file.filename,
                    'error': 'Invalid file type'
                })
        
        # Calculate aggregate confidence for appointment booking
        successful_results = [r for r in results if r.get('success')]
        
        if successful_results:
            avg_confidence = sum(r.get('confidence', 0) for r in successful_results) / len(successful_results)
            any_appointment_required = any(r.get('appointment_required', False) for r in successful_results)
            
            return jsonify({
                'success': True,
                'results': results,
                'count': len(results),
                'successful': len(successful_results),
                'aggregate': {
                    'average_confidence': round(avg_confidence, 2),
                    'appointment_recommended': any_appointment_required,
                    'animal_type': animal_type
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'results': results,
                'error': 'No successful predictions'
            }), 400
    
    except Exception as e:
        print(f"Error in batch prediction: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/diagnose/chat', methods=['POST'])
def diagnose_chat():
    """
    Chat-based diagnosis endpoint
    Supports all pet types
    
    JSON body:
        - message: symptom description
        - animal_type: any pet type
        - user_id: optional session identifier
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        message = data.get('message', '').strip()
        animal_type = data.get('animal_type', '').lower()
        user_id = data.get('user_id', str(uuid.uuid4()))
        
        # Validate inputs
        if not message:
            return jsonify({
                'success': False,
                'error': 'message is required'
            }), 400
        
        if not animal_type:
            return jsonify({
                'success': False,
                'error': 'animal_type is required'
            }), 400
        
        if animal_type not in ALL_PETS:
            return jsonify({
                'success': False,
                'error': f'Invalid animal_type. Supported: {", ".join(ALL_PETS)}'
            }), 400
        
        # Process chat message
        result = process_user_input('chat', message, animal_type, user_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    
    except Exception as e:
        print(f"Error in chat diagnosis: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/session/reset', methods=['POST'])
def reset_session():
    """
    Reset conversation session
    
    JSON body:
        - session_id: session to reset
    """
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        
        result = reset_conversation(session_id)
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/config', methods=['GET'])
def get_config():
    """Get system configuration and supported features"""
    status = get_system_status()
    
    return jsonify({
        'success': True,
        'pets': {
            'image_supported': PETS_WITH_IMAGE_SUPPORT,
            'text_only': status['supported_pets']['text_only'],
            'all': ALL_PETS
        },
        'models': {
            'image_available': status['image_models']['loaded'],
            'prediction_mode': status['image_models'].get('mode', 'unknown'),
            'pet_classes': status['image_models'].get('pet_classes', 0),
            'cattle_classes': status['image_models'].get('cattle_classes', 0),
            'chat_available': status['chat_models']['loaded']
        },
        'features': {
            'batch_upload': True,
            'chat_diagnosis': True,
            'multiclass_diagnosis': status['image_models'].get('mode') == 'multiclass',
            'disease_reports': True,
            'appointment_integration': True
        }
    }), 200


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum size: 16MB'
    }), 413


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'success': False,
        'error': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500


if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 VetAI Flask API Server")
    print("="*70)
    
    # Load models on startup
    print("\n🔄 Initializing models...")
    load_image_models()
    load_chat_models()
    
    status = get_system_status()
    
    print("\n📊 System Status:")
    print(f"   Image Models: {status['image_models']['loaded']}")
    print(f"   Chat Models: {status['chat_models']['loaded']}")
    print(f"   Image Support: {', '.join(PETS_WITH_IMAGE_SUPPORT)}")
    print(f"   All Pets: {', '.join(ALL_PETS)}")
    
    print("\n📍 Endpoints:")
    print("   GET  /health                - Health check")
    print("   GET  /api/config            - System configuration")
    print("   POST /api/predict/image     - Single image diagnosis")
    print("   POST /api/predict/batch     - Batch image diagnosis")
    print("   POST /api/diagnose/chat     - Chat diagnosis")
    print("   POST /api/session/reset     - Reset conversation")
    
    print(f"\n📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"🌐 Running on: http://localhost:5001")
    print("="*70 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)