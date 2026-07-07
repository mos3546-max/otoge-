extends Node2D

var parent_game = null
var buildings = [
	{"x": 20, "w": 45, "h": 140},
	{"x": 90, "w": 65, "h": 200},
	{"x": 170, "w": 35, "h": 110},
	{"x": 220, "w": 85, "h": 170},
	{"x": 330, "w": 55, "h": 240},
	{"x": 410, "w": 45, "h": 150},
	{"x": 480, "w": 75, "h": 190},
	{"x": 580, "w": 35, "h": 120},
	{"x": 640, "w": 85, "h": 210},
	{"x": 750, "w": 45, "h": 160}
]

func _ready():
	parent_game = get_parent()

func _process(delta):
	update() # 毎フレーム _draw を呼び出す

func _draw():
	if not parent_game:
		return
		
	var width = 800
	var height = 450
	var fever = parent_game.fever
	
	# 1. 空のグラデーション
	var points = PoolVector2Array([Vector2(0, 0), Vector2(width, 0), Vector2(width, 300), Vector2(0, 300)])
	var colors = PoolColorArray()
	if fever:
		colors.append(Color("#2b0042"))
		colors.append(Color("#2b0042"))
		colors.append(Color("#1b002c"))
		colors.append(Color("#1b002c"))
	else:
		colors.append(Color("#040824"))
		colors.append(Color("#040824"))
		colors.append(Color("#182b8a"))
		colors.append(Color("#182b8a"))
	draw_polygon(points, colors)
	
	# 2. サイバードット雨 (フォント不具合回避用のデータドットシャワー)
	var ticks = OS.get_ticks_msec()
	var rain_color = Color("#ff2060") if fever else Color("#00e0ff")
	rain_color.a = 0.28
	for col in range(30):
		var col_x = (width / 30.0) * col + 12
		var speed = 1.0 + abs(sin(col * 3.14)) * 0.8
		var offset = int(ticks * 0.08 * speed) % 300
		for row in range(12):
			var char_y = (row * 26 + offset) % 300
			var dot_size = 2.0 + abs(sin(col * 7.0 + row * 3.0)) * 4.0
			draw_rect(Rect2(col_x - dot_size/2.0, char_y, dot_size, dot_size), rain_color)

	# 3. データレーザー
	var laser_color = Color("#ffe000") if fever else Color("#00e0ff")
	laser_color.a = 0.22
	for bi in range(3):
		var bx = int(ticks * 0.04 + bi * 280) % width
		draw_line(Vector2(bx, 300), Vector2(bx, 0), laser_color, 1.2)

	# 4. 巨大スリットサン
	var beat_pulse = 1.0 + max(0.0, 1.0 - (float(ticks - parent_game.last_beat_time_msec) / float(parent_game.beat_interval * 1000.0))) * 0.14
	var sun_center = Vector2(width / 2.0, 120)
	var sun_r = 65.0 * beat_pulse
	
	var sun_color_top = Color("#ffe000")
	var sun_color_bottom = Color("#ff2060")
	sun_color_bottom.a = 0.1
	
	var sun_points = PoolVector2Array()
	var sun_colors = PoolColorArray()
	sun_points.append(sun_center)
	sun_colors.append(sun_color_top)
	
	var steps = 32
	for i in range(steps + 1):
		var angle = i * (PI * 2.0 / steps)
		var p_pos = sun_center + Vector2(cos(angle), sin(angle)) * sun_r
		sun_points.append(p_pos)
		var t = (p_pos.y - (sun_center.y - sun_r)) / (sun_r * 2.0)
		sun_colors.append(sun_color_top.linear_interpolate(sun_color_bottom, t))
	draw_polygon(sun_points, sun_colors)
	
	# スリットカット
	var bg_color = Color("#1b002c") if fever else Color("#0b164f")
	for sy in range(sun_center.y - sun_r, sun_center.y + sun_r, 12):
		var slice_h = 2.5 + ((sy - (sun_center.y - sun_r)) / (sun_r * 2.0)) * 6.5
		draw_rect(Rect2(sun_center.x - sun_r - 15, sy, sun_r * 2 + 30, slice_h), bg_color)

	# 5. 回路ビル群
	var line_color = Color("#ff2060") if fever else Color("#00e0ff")
	var circuit_color = Color("#ffe000") if fever else Color("#00e0ff")
	line_color.a = 0.55
	circuit_color.a = 0.28
	
	for b in buildings:
		var rect = Rect2(b.x, 300 - b.h, b.w, b.h)
		var body_color = Color("#200030") if fever else Color("#070a28")
		body_color.a = 0.38 if fever else 0.55
		draw_rect(rect, body_color)
		draw_rect(rect, line_color, false, 1.5)
		var mid_x = b.x + b.w / 2.0
		draw_line(Vector2(mid_x, 300), Vector2(mid_x, 300 - b.h * 0.68), circuit_color, 1.0)
		draw_line(Vector2(mid_x, 300 - b.h * 0.68), Vector2(mid_x - 12, 300 - b.h * 0.68 - 12), circuit_color, 1.0)
		draw_line(Vector2(mid_x - 12, 300 - b.h * 0.68 - 12), Vector2(mid_x - 12, 300 - b.h * 0.9), circuit_color, 1.0)

	# 6. 地面
	draw_rect(Rect2(0, 300, width, 150), Color("#060a28"))
	draw_line(Vector2(0, 300), Vector2(width, 300), Color("#ff2060") if fever else Color("#00f0ff"), 4.0)

	# 7. 3Dネオングリッド床
	var beat_progress = max(0.0, 1.0 - (float(ticks - parent_game.last_beat_time_msec) / float(parent_game.beat_interval * 1000.0)))
	var grid_color = Color("#ff3fde") if fever else Color("#00e0ff")
	grid_color.a = 0.38 + beat_progress * 0.52
	var grid_width = 1.8 + beat_progress * 1.5
	
	var line_y = 300
	for i in range(6):
		var cy = line_y + i * 25
		draw_line(Vector2(0, cy), Vector2(width, cy), grid_color, grid_width)

	var grid_count = 20
	var dot_color = Color("#ff60d0") if fever else Color("#00f0ff")
	for i in range(grid_count + 1):
		var x_top = (width / float(grid_count)) * i
		var x_bottom = ((width * 1.4) / float(grid_count)) * i - (width * 0.2)
		draw_line(Vector2(x_top, 300), Vector2(x_bottom, height), grid_color, grid_width)
		
		for j in range(6):
			var cy = line_y + j * 25
			var t_ratio = (cy - 300.0) / 150.0
			var cx = x_top + (x_bottom - x_top) * t_ratio
			draw_rect(Rect2(cx - 2, cy - 2, 4, 4), dot_color)

	# スクロール光線
	var speed_scale = 3.0 if parent_game.phase == "move" else 1.0
	var ray_color = Color("#ffe000") if fever else Color("#00e0ff")
	ray_color.a = 0.28
	var flow_speed = int(ticks * 0.05 * speed_scale) % 80
	for x in range(-80, width + 80, 80):
		var cx = x + flow_speed
		draw_line(Vector2(cx, 300), Vector2(cx - 30, height), ray_color, 3.0)
