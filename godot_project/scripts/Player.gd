extends Node2D

var parent_game = null

func _ready():
	parent_game = get_parent().get_parent()

func _process(delta):
	if not parent_game:
		return
	if parent_game.hit_stop_frames > 0:
		return
		
	var ticks = OS.get_ticks_msec()
	var action = parent_game.player_action_anim
	var bpm_timer = parent_game.beat_timer
	var bpm_interval = parent_game.beat_interval
	
	# スケール、位置、回転の制御
	var body_scale_y = 1.0
	var body_scale_x = 1.0
	var angle = 0.0
	var offset_y = 0.0
	
	# 1. 被弾時の処理
	if parent_game.player_hurt_time > 0.0:
		self.modulate = Color("#ff2060") if int(ticks / 60) % 2 == 0 else Color.white
	else:
		self.modulate = Color.white
		# 待機バウンス
		if action == "":
			var pulse = sin((bpm_timer / bpm_interval) * PI)
			body_scale_y = 1.0 - pulse * 0.08
			body_scale_x = 1.0 + pulse * 0.06

	# 2. アクションによるポーズ
	if action == "walk":
		angle = sin(ticks * 0.02) * 0.25
	elif action == "attack":
		angle = -0.3
	elif action == "retreat":
		angle = 0.25
	elif action == "jump":
		offset_y = -40.0
		angle = sin(ticks * 0.03) * 0.5
	elif action == "duck":
		body_scale_y = 0.45
		body_scale_x = 1.3
		offset_y = 15.0

	# ノードのプロパティを直接更新（draw_set_transformによる座標打ち消しを回避）
	self.scale = Vector2(body_scale_x, body_scale_y)
	self.rotation = angle
	
	# 位置の滑らかな補間 (Game.gdからこちらへ移植)
	self.position = self.position.linear_interpolate(parent_game.player_target + Vector2(0, offset_y), 10 * delta)
	
	update() # 再描画を要求

func _draw():
	if not parent_game:
		return
		
	var ticks = OS.get_ticks_msec()
	var action = parent_game.player_action_anim
	
	# 1. 背後の五線譜マフラー
	draw_scarf(ticks)
	
	# 2. パタポンの体（ネオン外枠の黒丸）
	var cyber_blue = Color("#00e0ff")
	var body_color = Color("#0c0f2b")
	draw_circle(Vector2.ZERO, 25.0, body_color)
	draw_circle_arc(Vector2.ZERO, 25.0, cyber_blue, 2.5)
	
	# 3. 足 (アクションごとに動く)
	var foot_y = 35.0
	var foot_l_x = -12.0
	var foot_r_x = 12.0
	var leg_color = Color("#00e0ff")
	
	if action == "walk":
		var walk_cycle = sin(ticks * 0.015) * 12.0
		draw_line(Vector2(foot_l_x, 15), Vector2(foot_l_x - 5, foot_y + walk_cycle), leg_color, 3.0)
		draw_line(Vector2(foot_r_x, 15), Vector2(foot_r_x + 5, foot_y - walk_cycle), leg_color, 3.0)
	elif action == "jump":
		draw_line(Vector2(foot_l_x, 15), Vector2(foot_l_x - 3, 22), leg_color, 3.0)
		draw_line(Vector2(foot_r_x, 15), Vector2(foot_r_x + 3, 22), leg_color, 3.0)
	else:
		draw_line(Vector2(foot_l_x, 15), Vector2(foot_l_x - 2, foot_y), leg_color, 3.0)
		draw_line(Vector2(foot_r_x, 15), Vector2(foot_r_x + 2, foot_y), leg_color, 3.0)

	# 4. パタポンアイ (大きな白目と瞳孔)
	var eye_center = Vector2(8, -5)
	if action == "attack":
		eye_center = Vector2(12, -3)
	elif action == "retreat":
		eye_center = Vector2(2, -5)
		
	draw_circle(eye_center, 11.0, Color.white)
	
	var pupil_center = eye_center + Vector2(2, 0)
	draw_circle(pupil_center, 5.0, Color("#101010"))
	draw_circle(pupil_center, 2.0, Color("#00e0ff"))

	# 5. イコライザーバイザー
	draw_visor(ticks)

	# 6. 音符バスター
	draw_weapon(action, ticks)

func draw_circle_arc(center, radius, color, width):
	var points = PoolVector2Array()
	var steps = 24
	for i in range(steps + 1):
		var angle = i * (PI * 2.0 / steps)
		points.append(center + Vector2(cos(angle), sin(angle)) * radius)
	draw_polyline(points, color, width)

func draw_scarf(ticks):
	var scarf_wave = sin(ticks * 0.015) * 4.0
	var scarf_color = Color("#00e0ff")
	scarf_color.a = 0.5
	for li in range(3):
		var points = PoolVector2Array()
		for step in range(12):
			var t_ratio = step / 11.0
			var px = -15.0 - t_ratio * 40.0
			var py = li * 4.0 + (scarf_wave - 5.0) * t_ratio
			points.append(Vector2(px, py))
		draw_polyline(points, scarf_color, 1.5)

func draw_visor(ticks):
	var visor_bg = Color("#00e0ff")
	visor_bg.a = 0.4
	draw_rect(Rect2(0, -9, 20, 8), visor_bg)
	draw_rect(Rect2(0, -9, 20, 8), Color("#00e0ff"), false, 1.2)
	
	var v_time = ticks * 0.02
	for bi in range(4):
		var bar_h = 1.0 + abs(sin(v_time + bi * 1.2)) * 5.0
		draw_rect(Rect2(2 + bi*4, -9 + (7 - bar_h), 2, bar_h), Color.white)

func draw_weapon(action, ticks):
	var hand_pos = Vector2(18, 12)
	if action == "attack":
		hand_pos = Vector2(25, 8)
	
	var buster_color = Color("#ffe000") if parent_game.is_charged else Color("#00e0ff")
	draw_rect(Rect2(hand_pos.x, hand_pos.y - 6, 16, 12), Color("#0d102f"))
	draw_rect(Rect2(hand_pos.x, hand_pos.y - 6, 16, 12), buster_color, false, 1.5)
	draw_circle(hand_pos + Vector2(16, 0), 4.0, buster_color)

	draw_line(Vector2(5, 5), hand_pos, Color("#00e0ff"), 3.0)
