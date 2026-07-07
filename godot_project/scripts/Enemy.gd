extends Node2D

var parent_game = null

func _ready():
	parent_game = get_parent().get_parent()

func _process(delta):
	if not parent_game:
		return
	if not visible:
		return
	if parent_game.hit_stop_frames > 0:
		return
		
	var ticks = OS.get_ticks_msec()
	var action = parent_game.enemy_action_anim
	var bpm_timer = parent_game.beat_timer
	var bpm_interval = parent_game.beat_interval
	
	# スケール、位置、回転の制御
	var body_scale_y = 1.0
	var body_scale_x = 1.0
	var angle = 0.0
	var offset_y = 0.0
	
	# 1. 被弾時の処理
	if parent_game.enemy_hurt_time > 0.0:
		self.modulate = Color("#ff2060") if int(ticks / 60) % 2 == 0 else Color.white
		body_scale_x = 1.2
		body_scale_y = 0.7
		offset_y = 10.0
	else:
		self.modulate = Color.white
		# 待機バウンス
		var pulse = sin((bpm_timer / bpm_interval) * PI + PI) * 0.08
		body_scale_y = 1.0 - pulse
		body_scale_x = 1.0 + pulse

	# トランスフォームプロパティを直接更新
	self.scale = Vector2(body_scale_x, body_scale_y)
	self.rotation = angle
	
	# 位置の滑らかな補間 (Game.gdからこちらへ移植)
	self.position = self.position.linear_interpolate(parent_game.enemy_target + Vector2(0, offset_y), 10 * delta)
	
	update() # 再描画を要求

func _draw():
	if not parent_game:
		return
	if not visible:
		return
		
	var ticks = OS.get_ticks_msec()
	var action = parent_game.enemy_action_anim
	
	# 1. 背後のホログラフィック・シールド
	var shield_color = Color("#ff2060")
	shield_color.a = 0.2
	draw_circle(Vector2.ZERO, 35.0, Color("#15051a"))
	draw_circle_arc(Vector2.ZERO, 35.0, Color("#ff2060"), 2.0)
	
	for i in range(-5, 6):
		var offset = i * 6
		draw_line(Vector2(offset, -30), Vector2(offset, 30), shield_color, 1.0)
		draw_line(Vector2(-30, offset), Vector2(30, offset), shield_color, 1.0)

	# 2. 赤い一つ目（モノアイ）
	var eye_center = Vector2(-5, -5)
	draw_circle(eye_center, 14.0, Color.white)
	
	var pupil_pos = eye_center + Vector2(sin(ticks * 0.005) * 4.0, cos(ticks * 0.003) * 2.0)
	draw_circle(pupil_pos, 7.0, Color("#ff2060"))
	draw_circle(pupil_pos, 2.5, Color("#ffe000"))

	# 3. カニクローアーム
	var arm_color = Color("#ff2060")
	var hand_pos = Vector2(-38, 15)
	if action == "attack":
		hand_pos = Vector2(-48, 5)
		
	draw_line(Vector2(-15, 10), Vector2(-28, 20), arm_color, 3.0)
	draw_line(Vector2(-28, 20), hand_pos, arm_color, 3.0)
	
	draw_circle(hand_pos, 4.0, arm_color)
	draw_line(hand_pos, hand_pos + Vector2(-6, -6), arm_color, 2.0)
	draw_line(hand_pos, hand_pos + Vector2(-6, 6), arm_color, 2.0)

	# 4. 二足逆関節の足
	var leg_color = Color("#ff2060")
	var foot_y = 35.0
	draw_line(Vector2(-12, 20), Vector2(-18, 30), leg_color, 3.0)
	draw_line(Vector2(-18, 30), Vector2(-12, foot_y), leg_color, 3.0)
	draw_line(Vector2(12, 20), Vector2(18, 30), leg_color, 3.0)
	draw_line(Vector2(18, 30), Vector2(12, foot_y), leg_color, 3.0)

func draw_circle_arc(center, radius, color, width):
	var points = PoolVector2Array()
	var steps = 24
	for i in range(steps + 1):
		var angle = i * (PI * 2.0 / steps)
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)
	draw_polyline(points, color, width)
