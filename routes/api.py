from flask import Blueprint, jsonify, request

api_bp = Blueprint("api", __name__)

_game = None


def set_game(game):
    global _game
    _game = game


@api_bp.route("/state", methods=["GET"])
def get_state():
    return jsonify(_game.get_state())


@api_bp.route("/new", methods=["POST"])
def new_game():
    data = request.get_json(silent=True) or {}
    # Extract config
    config = {
        "undo_enabled": data.get("undo_enabled", False),
        "timer_mode": data.get("timer_mode", None),
        "time_seconds": data.get("time_seconds", None),
        "increment": data.get("increment", 0)
    }
    _game.reset(config)
    return jsonify({"success": True, **_game.get_state()})


@api_bp.route("/legal-moves", methods=["POST"])
def legal_moves():
    data = request.get_json(silent=True) or {}
    row = data.get("row")
    col = data.get("col")

    if row is None or col is None:
        return jsonify({"error": "Missing row or col"}), 400

    moves = _game.get_legal_moves_for_square(row, col)
    return jsonify({"legal_moves": moves})


@api_bp.route("/move", methods=["POST"])
def make_move():
    data = request.get_json(silent=True) or {}
    from_row = data.get("from_row")
    from_col = data.get("from_col")
    to_row = data.get("to_row")
    to_col = data.get("to_col")

    if None in (from_row, from_col, to_row, to_col):
        return jsonify({"error": "Missing move coordinates"}), 400

    result = _game.make_move(from_row, from_col, to_row, to_col)
    return jsonify(result)


@api_bp.route("/promote", methods=["POST"])
def promote():
    data = request.get_json(silent=True) or {}
    piece_type = data.get("piece_type")
    if not piece_type:
        return jsonify({"error": "Missing piece_type"}), 400
    
    result = _game.promote(piece_type)
    return jsonify(result)


@api_bp.route("/resign", methods=["POST"])
def resign():
    data = request.get_json(silent=True) or {}
    color = data.get("color")
    if not color:
        return jsonify({"error": "Missing color to resign"}), 400
    
    result = _game.resign(color)
    return jsonify(result)


@api_bp.route("/undo", methods=["POST"])
def undo():
    result = _game.undo()
    return jsonify(result)


@api_bp.route("/redo", methods=["POST"])
def redo():
    result = _game.redo()
    return jsonify(result)


@api_bp.route("/tick", methods=["POST"])
def tick():
    # If the timer has run out, we trigger a timeout
    state = _game.get_state()
    # Check if either player ran out of time
    time_white = state.get("time_white")
    time_black = state.get("time_black")
    
    if time_white is not None and time_white <= 0:
        _game.timeout("white")
    elif time_black is not None and time_black <= 0:
        _game.timeout("black")
        
    return jsonify(_game.get_state())


@api_bp.route("/reset", methods=["POST"])
def reset_game():
    _game.reset()
    return jsonify({"success": True, **_game.get_state()})
