from flask import Flask, jsonify
from src.routes.example_routes import example_bp
from src.routes.device_routes import device_bp
from src.routes.brain_routes import brain_bp
from src.services.brain_service import init_brain_agent_with_app
import logging

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.DevelopmentConfig') # Load default config
    # app.config.from_pyfile('instance/config.py', silent=True) # Load instance config if it exists

    # Configure basic logging
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    app.logger.setLevel(logging.DEBUG) # Flask app specific logger level

    # Initialize Brain Agent (app-level singleton)
    # This ensures the agent is ready, or logs critical errors if init fails.
    try:
        init_brain_agent_with_app(app)
    except Exception as e:
        app.logger.critical(f"Failed to initialize Brain Agent during app creation: {e}", exc_info=True)
        # Depending on policy, you might want the app to not start if the brain is critical.
        # For now, it will log, and the brain service will report unavailability.

    # Register blueprints
    app.register_blueprint(example_bp, url_prefix='/api/example')
    app.register_blueprint(device_bp, url_prefix='/api/devices')
    app.register_blueprint(brain_bp, url_prefix='/api/brain')

    @app.route('/health')
    def health_check():
        # You could add a check here to see if the brain agent is initialized
        brain_status = "OK"
        from src.services.brain_service import get_brain_agent_instance
        if get_brain_agent_instance() is None:
            brain_status = "DEGRADED (Brain Agent Not Initialized)"
            app.logger.warning("Health check: Brain Agent is not initialized.")
        return jsonify({"status": "OK", "brain_service": brain_status})

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=app.config.get("DEBUG", True), host='0.0.0.0', port=5000) # Use config for debug 