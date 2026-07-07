extends Node2D

# 武器・チップデータベース
const WEAPONS_DB = {
	"wood_spear": { "name": "ノーマルバスター", "type": "spear", "atk": 0, "hp": 0, "def": 0, "crit": 0, "range": 260, "rarity": "common", "desc": "初期型ショット。射程:260" },
	"stone_spear": { "name": "チャージショット", "type": "spear", "atk": 5, "hp": 0, "def": 0, "crit": 2, "range": 300, "rarity": "common", "desc": "出力を強化したショット。射程:300" },
	"wood_shield": { "name": "ライトシールド", "type": "shield", "atk": 0, "hp": 15, "def": 2, "range": 100, "rarity": "common", "desc": "軽量型防壁。射程:100" },
	
	"iron_spear": { "name": "プラズマバスター", "type": "spear", "atk": 12, "hp": 10, "def": 2, "range": 350, "rarity": "uncommon", "desc": "高エネルギー弾。射程:350" },
	"iron_shield": { "name": "プロトシールド", "type": "shield", "atk": 0, "hp": 50, "def": 6, "range": 120, "rarity": "uncommon", "desc": "試作型電磁シールド。射程:120" },
	"hunter_bow": { "name": "レーザーバスター", "type": "bow", "atk": 11, "hp": 0, "def": 0, "crit": 8, "range": 520, "rarity": "uncommon", "desc": "高速長射程レーザー。射程:520" },
	
	"ice_spear": { "name": "アイスシュート", "type": "spear", "atk": 28, "hp": 25, "def": 0, "crit": 10, "range": 300, "rarity": "rare", "desc": "冷却型バスター。射程:300" },
	"gold_shield": { "name": "メタルシールド", "type": "shield", "atk": 3, "hp": 100, "def": 14, "range": 150, "rarity": "rare", "desc": "回転スチール防壁。射程:150" },
	"fire_bow": { "name": "ファイアシュート", "type": "bow", "atk": 22, "hp": 0, "def": 0, "crit": 15, "range": 450, "rarity": "rare", "desc": "超高温プラズマ射出。射程:450" },
	"crystal_staff": { "name": "ジュエルバスター", "type": "staff", "atk": 33, "hp": 35, "def": 4, "range": 350, "rarity": "rare", "desc": "反射レーザー乱射。射程:350" },
	
	"gpgnir": { "name": "ハイパーバスター", "type": "spear", "atk": 60, "hp": 55, "def": 5, "crit": 20, "range": 480, "rarity": "legendary", "desc": "ギガプラズマを放射。射程:480" },
	"aegis": { "name": "ホーリーバリア", "type": "shield", "atk": 5, "hp": 200, "def": 28, "range": 150, "rarity": "legendary", "desc": "絶対防御障壁。射程:150" },
	"failures_bow": { "name": "ソニックバスター", "type": "bow", "atk": 52, "hp": 45, "def": 0, "crit": 25, "range": 500, "rarity": "legendary", "desc": "超高周波空間破壊弾。射程:500" },
	"shadow_bow": { "name": "シャドウブレード", "type": "bow", "atk": 55, "hp": 30, "def": 2, "crit": 22, "range": 300, "rarity": "legendary", "desc": "暗黒物質手裏剣投擲。射程:300" },
	"sage_staff": { "name": "プラズマキャノン", "type": "staff", "atk": 70, "hp": 70, "def": 8, "range": 600, "rarity": "legendary", "desc": "要塞破壊レーザー砲。射程:600" },
	"excalibur": { "name": "ゼットセイバー", "type": "sword", "atk": 110, "hp": 130, "def": 15, "crit": 30, "range": 130, "rarity": "legendary", "desc": "純光エネルギーの刃。射程:130" }
}

# 状態変数
var bpm = 120
var beat_interval = 60.0 / bpm
var beat_timer = 0.0
var beat_count = 0
var step_count = 0
var turn = "input" # "input" or "action"
var phase = "move" # "move" or "combat"
var last_beat_time_msec = 0

var current_inputs = []
var has_input_this_beat = false

# 判定ウィンドウ (秒)
var perfect_window = 0.14
var good_window = 0.24

# ジュースエフェクト
var shake_time = 0.0
var shake_intensity = 0.0
var hit_stop_frames = 0
var boss_warning_time = 0.0

# プレイヤーのゲームステータス
var level = 1
var xp = 0
var next_xp = 100
var hp = 100
var max_hp = 100
var base_atk = 15
var base_def = 5
var gold = 100 # 初期資金
var combo = 0
var fever = false
var fever_meter = 0
var is_charged = false
var stage = 1
var wave = 1
var max_waves = 5
var distance_to_boss = 4
var move_progress = 0
var move_required = 3

var equipped_id = "wood_spear"
var inventory = ["wood_spear"]
var chests = ["wood"] # 初期カプセル
var evo_index = 0
var combat_log = "サイバーネットワークに接続しました。"

# 敵のデータ
var enemy_data = null # { name, hp, max_hp, atk, def, is_boss }

# SFX・BGM合成キャッシュ
var sfx_beat = null
var sfx_pata = null
var sfx_pon = null
var sfx_chaka = null
var sfx_don = null
var audio_players = []
var next_player_idx = 0
var bgm_player = null
var last_total_beats = 0

# アニメーション用変数
var player_origin = Vector2(200, 260)
var enemy_origin = Vector2(600, 260)
var player_target = Vector2(200, 260)
var enemy_target = Vector2(600, 260)
var base_scale = Vector2(0.08, 0.08)
var player_hurt_time = 0.0
var enemy_hurt_time = 0.0
var player_action_anim = ""
var enemy_action_anim = ""

onready var player = $Stage/Player
onready var enemy = $Stage/Enemy
onready var progress_bar = $UI/ProgressBar
onready var info_label = $UI/HUD/InfoLabel
onready var beat_dots = [
	$UI/BeatIndicator/Beat1,
	$UI/BeatIndicator/Beat2,
	$UI/BeatIndicator/Beat3,
	$UI/BeatIndicator/Beat4
]
onready var inventory_panel = $UI/InventoryPanel
onready var chest_list = $UI/InventoryPanel/ChestList
onready var inventory_list = $UI/InventoryPanel/InventoryList
onready var status_label = $UI/InventoryPanel/StatusLabel

# リズムコマンド
const COMMANDS = {
	"walk": {"pattern": ["pata", "pata", "pata", "pon"], "name": "前進"},
	"attack": {"pattern": ["pon", "pon", "pata", "pon"], "name": "射撃"},
	"retreat": {"pattern": ["pon", "pata", "pon", "pata"], "name": "後退"},
	"jump": {"pattern": ["pon", "chaka", "pon", "chaka"], "name": "ジャンプ"},
	"duck": {"pattern": ["chaka", "pon", "chaka", "pon"], "name": "スライド"},
	"charge": {"pattern": ["don", "don", "pata", "pon"], "name": "エネルギーチャージ"},
	"miracle": {"pattern": ["pata", "pon", "chaka", "don"], "name": "E缶全体バースト"}
}

func _ready():
	randomize()
	beat_timer = 0.0
	last_beat_time_msec = OS.get_ticks_msec()
	enemy.visible = false
	update_ui()
	setup_keybinds()
	connect_ui_signals()
	
	# BGMプレイヤー作成
	bgm_player = AudioStreamPlayer.new()
	add_child(bgm_player)
	
	init_sfx_system()
	
	# 初期BGMループ再生開始
	change_bpm(120)

func connect_ui_signals():
	$UI/HUD/DeckButton.connect("pressed", self, "_on_DeckButton_pressed")
	$UI/InventoryPanel/CloseButton.connect("pressed", self, "_on_CloseButton_pressed")
	$UI/InventoryPanel/DecodeButton.connect("pressed", self, "_on_DecodeButton_pressed")
	$UI/InventoryPanel/EquipButton.connect("pressed", self, "_on_EquipButton_pressed")

func setup_keybinds():
	var keys = {
		"pata": [KEY_A, KEY_J],
		"pon": [KEY_S, KEY_K],
		"chaka": [KEY_D, KEY_L],
		"don": [KEY_F, KEY_I]
	}
	for action in keys:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for key_code in keys[action]:
			var event = InputEventKey.new()
			event.scancode = key_code
			InputMap.action_add_event(action, event)

func _process(delta):
	# ボス警告演出の進行
	if boss_warning_time > 0.0:
		boss_warning_time -= delta
		if has_node("UI/BossWarningLabel"):
			$UI/BossWarningLabel.visible = (int(OS.get_ticks_msec() / 150) % 2 == 0)
		update()
	else:
		if has_node("UI/BossWarningLabel"):
			$UI/BossWarningLabel.visible = false

	# ヒットストップ (メトロノーム進行を妨げないように return を排除)
	if hit_stop_frames > 0:
		hit_stop_frames -= 1

	# 画面揺れ (Screen Shake)
	if shake_time > 0.0:
		shake_time -= delta
		var offset = Vector2(rand_range(-1.0, 1.0), rand_range(-1.0, 1.0)) * shake_intensity
		$Stage.position = offset
		if shake_time <= 0.0:
			$Stage.position = Vector2.ZERO

	# メトロノーム進行 (BGMのオーディオ再生位置にミリ秒精度で完全同期)
	if bgm_player != null and bgm_player.playing:
		var current_pos = bgm_player.get_playback_position()
		
		# ハードウェア遅延（レイテンシ）を補正して完璧にビジュアルと同期
		var latency = AudioServer.get_time_to_next_mix() + AudioServer.get_output_latency()
		current_pos = fmod(current_pos + latency, (60.0 / bpm) * 4.0)
		
		beat_timer = fmod(current_pos, beat_interval)
		beat_count = int(current_pos / beat_interval) % 4
		
		var total_beats = int(current_pos / beat_interval)
		var beat_changed = false
		if total_beats != last_total_beats:
			beat_changed = true
			last_total_beats = total_beats
			
		if beat_changed:
			last_beat_time_msec = OS.get_ticks_msec()
			step_count += 1
			has_input_this_beat = false
			
			# 拍の更新UI
			update_rhythm_ui()
			play_beat_sound()

			if beat_count == 0:
				handle_measure_end()

	var progress = (beat_timer / beat_interval) * 100.0
	progress_bar.value = progress

		# プレイヤーの被弾アニメーション
	if player_hurt_time > 0.0:
		player_hurt_time -= delta
		player_target = player_origin - Vector2(35, 0)
		player.modulate = Color("#ff2060") if int(OS.get_ticks_msec() / 60) % 2 == 0 else Color.white
		if player_hurt_time <= 0.0:
			player.modulate = Color.white
			player_target = player_origin
			
	# 敵の被弾アニメーション
	if enemy_hurt_time > 0.0:
		enemy_hurt_time -= delta
		enemy_target = enemy_origin + Vector2(35, 0)
		enemy.modulate = Color("#ff2060") if int(OS.get_ticks_msec() / 60) % 2 == 0 else Color.white
		if enemy_hurt_time <= 0.0:
			enemy.modulate = Color.white
			enemy_target = enemy_origin



func _input(event):
	# Iキーでインベントリパネル開閉
	if event is InputEventKey and event.pressed and event.scancode == KEY_I:
		if not event.echo:
			toggle_inventory()
			get_tree().set_input_as_handled()
			return

	if turn != "input" or has_input_this_beat or inventory_panel.visible:
		return

	var drum_type = ""
	if event.is_action_pressed("pata"):
		drum_type = "pata"
	elif event.is_action_pressed("pon"):
		drum_type = "pon"
	elif event.is_action_pressed("chaka"):
		drum_type = "chaka"
	elif event.is_action_pressed("don"):
		drum_type = "don"

	if drum_type != "":
		trigger_drum_input(drum_type)

func trigger_drum_input(type):
	has_input_this_beat = true
	var elapsed = beat_timer
	var diff = 0.0
	
	if elapsed <= beat_interval / 2.0:
		# 拍の直後 (遅すぎた入力 = 正の値)
		diff = elapsed
	else:
		# 拍の直前 (早すぎた入力 = 負の値)
		diff = elapsed - beat_interval
		
	# pata コマンドのタイミングを少し緩やかに補正
	if type == "pata":
		diff *= 0.55
	
	current_inputs.append({"name": type, "diff": diff})
	play_drum_sound(type)
	print("Input: ", type, " Signed Diff: ", diff)

func handle_measure_end():
	if turn == "input":
		turn = "action"
		evaluate_inputs()
	else:
		turn = "input"
		current_inputs.clear()
		update_ui()

func evaluate_inputs():
	if current_inputs.size() != 4:
		handle_miss()
		return
		
	# 各打鍵のズレが許容ウィンドウ（good_window）内か厳密に検証
	var all_in_window = true
	var perfect_count = 0
	
	# 個々の打鍵のズレ方向を解析
	var max_abs_diff = 0.0
	var worst_diff = 0.0
	
	for inp in current_inputs:
		var d = inp["diff"]
		var abs_d = abs(d)
		if abs_d > max_abs_diff:
			max_abs_diff = abs_d
			worst_diff = d
			
		if abs_d > good_window:
			all_in_window = false
		if abs_d <= perfect_window:
			perfect_count += 1
			
	# タイミングを外した打鍵があれば早すぎ/遅すぎ判定ポップアップを出してミス
	if not all_in_window:
		var miss_text = "TOO EARLY!" if worst_diff < 0.0 else "TOO LATE!"
		spawn_timing_popup(miss_text, Color("#ff2060"))
		handle_miss()
		return

	# コマンドマッチング
	var matched_cmd = null
	for cmd_key in COMMANDS:
		var pattern = COMMANDS[cmd_key]["pattern"]
		var is_match = true
		for i in range(4):
			if current_inputs[i]["name"] != pattern[i]:
				is_match = false
				break
		if is_match:
			matched_cmd = cmd_key
			break
			
	if matched_cmd != null:
		var is_perfect = perfect_count >= 3
		var popup_text = "PERFECT!" if is_perfect else "GOOD"
		var popup_color = Color("#ffe000") if is_perfect else Color("#00e0ff")
		
		# 判定テキストの画面ポップアップ
		spawn_timing_popup(popup_text, popup_color)
		
		execute_action(matched_cmd, is_perfect)
	else:
		spawn_timing_popup("BAD SEQUENCE", Color("#a0a8b8"))
		handle_miss()

func execute_action(cmd_key, is_crit):
	print("Execute action: ", cmd_key, " Perfect: ", is_crit)
	combo += 1
	
	# PERFECT時はフィーバーメーター上昇率アップ (GOOD=12, PERFECT=20)
	var fever_add = 20 if is_crit else 12
	fever_meter = min(100, fever_meter + fever_add)
	if fever_meter >= 100:
		fever = true
	
	# ジュース演出
	shake_time = 0.25 if !is_crit else 0.45
	shake_intensity = 6.0 if !is_crit else 14.0
	hit_stop_frames = 4 if !is_crit else 8
	
	# 各アクションの挙動
	if cmd_key == "walk":
		combat_log = "前進コマンド成功。"
		player_action_anim = "walk"
		player_target = player_origin + Vector2(60, 0)
		yield(get_tree().create_timer(0.2), "timeout")
		player_target = player_origin
		player_action_anim = ""
		
		if phase == "move":
			move_progress += 1
			if move_progress >= move_required:
				spawn_enemy()
				
	elif cmd_key == "attack":
		combat_log = "バスター発射！"
		player_action_anim = "attack"
		player_target = player_origin + Vector2(25, 0)
		player.rotation_degrees = 12.0
		yield(get_tree().create_timer(0.2), "timeout")
		player_target = player_origin
		player.rotation_degrees = 0.0
		player.scale = base_scale
		player_action_anim = ""
		
		if phase == "combat" and enemy_data != null:
			var wp = WEAPONS_DB[equipped_id]
			var dmg = base_atk + wp["atk"]
			if is_charged:
				dmg *= 3
				is_charged = false
				combat_log = "フルチャージバスター直撃！"
			if is_crit:
				dmg = int(dmg * 1.5)
			if fever:
				dmg = int(dmg * 1.25)
			
			var final_dmg = max(1, dmg - enemy_data["def"])
			enemy_data["hp"] = max(0, enemy_data["hp"] - final_dmg)
			enemy_hurt_time = 0.4 # 被弾アニメ開始
			
			if enemy_data["hp"] <= 0:
				handle_enemy_defeat()
				
	elif cmd_key == "retreat":
		combat_log = "バックダッシュ！"
		player_action_anim = "retreat"
		player_target = player_origin - Vector2(60, 0)
		yield(get_tree().create_timer(0.2), "timeout")
		player_target = player_origin
		player_action_anim = ""
		
	elif cmd_key == "jump":
		combat_log = "高高度ジャンプ！"
		player_action_anim = "jump"
		player_target = player_origin - Vector2(0, 80)
		player.rotation_degrees = -25.0
		yield(get_tree().create_timer(0.3), "timeout")
		player_target = player_origin
		player.rotation_degrees = 0.0
		player.scale = base_scale
		player_action_anim = ""
		
	elif cmd_key == "duck":
		combat_log = "スライディング潜り込み！"
		player_action_anim = "duck"
		player.scale = Vector2(base_scale.x * 1.3, base_scale.y * 0.45)
		yield(get_tree().create_timer(0.35), "timeout")
		player.scale = base_scale
		player_action_anim = ""
		
	elif cmd_key == "charge":
		combat_log = "エネルギーチャージ中..."
		is_charged = true
		
	elif cmd_key == "miracle":
		combat_log = "E缶起動！全体バースト発射！"
		shake_time = 0.6
		shake_intensity = 18.0
		hit_stop_frames = 12
		
		if phase == "combat" and enemy_data != null:
			var wp = WEAPONS_DB[equipped_id]
			var dmg = int((base_atk + wp["atk"]) * 2.8)
			enemy_data["hp"] = max(0, enemy_data["hp"] - dmg)
			enemy_hurt_time = 0.5 # E缶被弾開始
			
			var heal = int(max_hp * 0.35)
			hp = min(max_hp, hp + heal)
			
			if enemy_data["hp"] <= 0:
				handle_enemy_defeat()
				
	# 敵のカウンター攻撃ターン（戦闘フェーズのみ）
	if phase == "combat" and enemy_data != null and enemy_data["hp"] > 0:
		yield(get_tree().create_timer(0.4), "timeout")
		resolve_enemy_turn(cmd_key)

func handle_miss():
	combo = 0
	fever = false
	fever_meter = max(0, fever_meter - 25)
	combat_log = "ビートを外しました (MISS)"

func resolve_enemy_turn(player_cmd):
	if enemy_data == null: return
	
	var avoid = false
	var dmg = enemy_data["atk"]
	
	# 回避判定
	if player_cmd == "duck" and randf() < 0.6:
		avoid = true
		combat_log = "スライディングで敵の弾幕を潜り抜けた！"
	elif player_cmd == "jump" and randf() < 0.6:
		avoid = true
		combat_log = "ジャンプで地割れ攻撃を回避！"
		
	if avoid:
		return
		
	var is_defending = (player_cmd == "retreat" or player_cmd == "duck")
	if is_defending:
		dmg = int(dmg * 0.3)
		combat_log += " (ガード成功、ダメージ軽減)"
		
	var final_enemy_dmg = max(1, dmg - base_def)
	hp = max(0, hp - final_enemy_dmg)
	player_hurt_time = 0.4 # 被弾アニメ開始
	
	# 被弾による画面揺れ
	shake_time = 0.35
	shake_intensity = 8.0
	hit_stop_frames = 6
	
	if hp <= 0:
		handle_player_defeat()

func spawn_enemy():
	phase = "combat"
	move_progress = 0
	var is_boss_wave = (distance_to_boss == 0)
	var scale = pow(1.2, stage - 1)
	
	var new_bpm = 120
	
	if is_boss_wave:
		enemy_data = {
			"name": "DWN-003 カットマン",
			"hp": int(350 * scale),
			"max_hp": int(350 * scale),
			"atk": int(25 * scale),
			"def": int(8 * scale),
			"is_boss": true
		}
		new_bpm = 160
		boss_warning_time = 2.5
		shake_time = 1.2
		shake_intensity = 5.0
		combat_log = "[ALERT] ボスロボ『カットマン』を検知！ (BPM 160)"
	else:
		# 通常敵のバリエーション
		var enemy_types = [
			{"name": "メットール", "hp": 50, "atk": 12, "def": 2, "bpm": 120},
			{"name": "バブリー・スライム", "hp": 80, "atk": 8, "def": 4, "bpm": 90},
			{"name": "スパム・フライ", "hp": 35, "atk": 15, "def": 0, "bpm": 145},
			{"name": "サイバー・スナイパー", "hp": 60, "atk": 18, "def": 1, "bpm": 130}
		]
		var et = enemy_types[randi() % enemy_types.size()]
		enemy_data = {
			"name": et["name"],
			"hp": int(et["hp"] * scale),
			"max_hp": int(et["hp"] * scale),
			"atk": int(et["atk"] * scale),
			"def": int(et["def"] * scale),
			"is_boss": false
		}
		new_bpm = et["bpm"]
		combat_log = "敵『%s』が出現！ (BPM %d)" % [et["name"], new_bpm]
	
	change_bpm(new_bpm)
	enemy.visible = true
	enemy_target = enemy_origin
	update_ui()

func handle_enemy_defeat():
	combat_log = "%sを完全デリート。" % enemy_data["name"]
	enemy.visible = false
	phase = "move"
	
	# 通常移動テンポに戻す
	change_bpm(120)
	
	var xp_gain = 150 if enemy_data["is_boss"] else 25
	var gold_gain = 100 if enemy_data["is_boss"] else 15
	xp += xp_gain
	gold += gold_gain
	
	# カプセルドロップ (35% の確率)
	if randf() < 0.35:
		var types = ["wood", "iron", "gold", "jeweled"]
		var drop = types[randi() % types.size()]
		chests.append(drop)
		combat_log += " データカプセル [%s] を回収！" % drop
		
	# レベルアップ判定
	if xp >= next_xp:
		level += 1
		xp -= next_xp
		next_xp = int(next_xp * 1.5)
		max_hp += 15
		hp = max_hp
		combat_log += " LEVEL UP!"
		
	if enemy_data["is_boss"]:
		distance_to_boss = 4
		stage += 1
	else:
		distance_to_boss = max(0, distance_to_boss - 1)
		
	enemy_data = null
	update_ui()

func handle_player_defeat():
	combat_log = "大破しました。セーフモードで復旧中..."
	hp = max_hp
	combo = 0
	fever = false
	fever_meter = 0
	stage = 1
	distance_to_boss = 4
	phase = "move"
	enemy.visible = false
	enemy_data = null
	update_ui()

func update_rhythm_ui():
	for i in range(4):
		if i == beat_count:
			beat_dots[i].color = Color.cyan if !fever else Color.magenta
		else:
			beat_dots[i].color = Color.darkgray

func update_ui():
	var wp = WEAPONS_DB[equipped_id]
	var enemy_hp_txt = ""
	if phase == "combat" and enemy_data != null:
		enemy_hp_txt = " | ENEMY HP: %d/%d" % [enemy_data["hp"], enemy_data["max_hp"]]
		
	info_label.text = "LEVEL: %d | XP: %d/%d | HP: %d/%d%s\nGOLD: %d | EQUIP: %s | COMBO: %d | MODE: %s\nLOG: %s" % [
		level, xp, next_xp, hp, max_hp, enemy_hp_txt, gold, wp["name"], combo,
		("FEVER" if fever else "NORMAL"), combat_log
	]

# ----------------------------------------------------
# 🛍️ インベントリ & 鑑定 UI システム
# ----------------------------------------------------

func toggle_inventory():
	inventory_panel.visible = !inventory_panel.visible
	if inventory_panel.visible:
		refresh_inventory_lists()

func refresh_inventory_lists():
	chest_list.clear()
	for ch in chests:
		chest_list.add_item("カプセル [%s]" % ch)
		
	inventory_list.clear()
	for item_id in inventory:
		var wp = WEAPONS_DB[item_id]
		var equip_marker = " [E]" if item_id == equipped_id else ""
		inventory_list.add_item("%s%s" % [wp["name"], equip_marker])

func _on_DeckButton_pressed():
	toggle_inventory()

func _on_CloseButton_pressed():
	inventory_panel.visible = false

func _on_DecodeButton_pressed():
	var selected = chest_list.get_selected_items()
	if selected.size() == 0:
		status_label.text = "カプセルを選択してください。"
		return
		
	if gold < 10:
		status_label.text = "ネジが足りません (10個必要)。"
		return
		
	gold -= 10
	var index = selected[0]
	var chest_type = chests[index]
	chests.remove(index)
	
	# カプセル解析プール
	var pool = []
	if chest_type == "wood":
		pool = ["wood_spear", "stone_spear", "wood_shield"]
	elif chest_type == "iron":
		pool = ["stone_spear", "iron_spear", "iron_shield", "hunter_bow"]
	elif chest_type == "gold":
		pool = ["iron_spear", "ice_spear", "gold_shield", "fire_bow", "crystal_staff"]
	elif chest_type == "jeweled":
		pool = ["ice_spear", "gpgnir", "aegis", "failures_bow", "shadow_bow", "sage_staff", "excalibur"]
		
	var selected_id = pool[randi() % pool.size()] if pool.size() > 0 else "wood_spear"
	inventory.append(selected_id)
	
	var wp = WEAPONS_DB[selected_id]
	status_label.text = "解析成功: [%s] チップをインポートしました！" % wp["name"]
	combat_log = "データカプセル解析完了: %s" % wp["name"]
	
	refresh_inventory_lists()
	update_ui()

func _on_EquipButton_pressed():
	var selected = inventory_list.get_selected_items()
	if selected.size() == 0:
		status_label.text = "装備するチップを選択してください。"
		return
		
	var index = selected[0]
	var item_id = inventory[index]
	equipped_id = item_id
	
	var wp = WEAPONS_DB[item_id]
	status_label.text = "[%s] を装備しました。" % wp["name"]
	combat_log = "装備変更: %s" % wp["name"]
	
	refresh_inventory_lists()
	update_ui()

# 警告描画用
func _draw():
	if boss_warning_time > 0.0:
		draw_boss_warning()

func draw_boss_warning():
	var width = 800
	var warn_bg = Color("#ff2060")
	warn_bg.a = 0.35
	draw_rect(Rect2(0, 100, width, 60), warn_bg)
	
	draw_line(Vector2(0, 100), Vector2(width, 100), Color("#ffe000"), 3.0)
	draw_line(Vector2(0, 160), Vector2(width, 160), Color("#ffe000"), 3.0)

# ----------------------------------------------------
# 🔊 動的リアルタイム・シンセ音響システム
# ----------------------------------------------------

func init_sfx_system():
	# 8個の AudioStreamPlayer プールを作成して同時再生に対応
	for i in range(8):
		var player_node = AudioStreamPlayer.new()
		add_child(player_node)
		audio_players.append(player_node)
		
	# 音声をリアルタイム合成してメモリ上にキャッシュ
	sfx_beat = create_synth_stream(600, 0.03, "click")
	sfx_pata = create_synth_stream(120, 0.18, "kick")
	sfx_pon = create_synth_stream(220, 0.16, "fm_snare")
	sfx_chaka = create_synth_stream(0, 0.04, "hat")
	sfx_don = create_synth_stream(150, 0.20, "kick")

func create_synth_stream(frequency, duration, wave_type):
	var sample = AudioStreamSample.new()
	sample.format = AudioStreamSample.FORMAT_8_BITS
	sample.loop_mode = AudioStreamSample.LOOP_DISABLED
	sample.mix_rate = 11025
	
	var num_samples = int(11025 * duration)
	var bytes = PoolByteArray()
	bytes.resize(num_samples)
	
	for i in range(num_samples):
		var t = float(i) / 11025.0
		var val = 0
		
		# 減衰音エンベロープ (指数関数的減衰で高アタック化)
		var env = 1.0 - (float(i) / float(num_samples))
		env = env * env
		
		if wave_type == "sine":
			val = int(sin(2.0 * PI * frequency * t) * 127)
		elif wave_type == "kick":
			# 808ピッチスライドベースキック (180Hz -> 45Hz)
			var freq = 45.0 + (180.0 - 45.0) * exp(-t * 45.0)
			val = int(sin(2.0 * PI * freq * t) * 127)
		elif wave_type == "fm_snare":
			# FM合成シンセポン (キャリア: freq, モジュレータ: 380Hz)
			var modulator = sin(2.0 * PI * 380.0 * t) * 2.0
			val = int(sin(2.0 * PI * frequency * t + modulator) * 127)
		elif wave_type == "hat":
			# デジタルノイズハット (ホワイトノイズ + 金属サイン波)
			var noise = randf() * 2.0 - 1.0
			var metal = sin(2.0 * PI * 9000.0 * t)
			val = int((noise * 0.45 + metal * 0.55) * 127)
		elif wave_type == "click":
			# 乾いたデジタルクリック
			var freq = 800.0 * exp(-t * 80.0)
			val = int(sin(2.0 * PI * freq * t) * 127)
			
		val = int(val * env)
		bytes.set(i, val + 128)
		
	sample.data = bytes
	return sample

func play_synth(stream):
	if stream == null or audio_players.size() == 0: return
	var p = audio_players[next_player_idx]
	p.stream = stream
	p.play()
	next_player_idx = (next_player_idx + 1) % audio_players.size()

func play_beat_sound():
	play_synth(sfx_beat)

func play_drum_sound(type):
	if type == "pata":
		play_synth(sfx_pata)
	elif type == "pon":
		play_synth(sfx_pon)
	elif type == "chaka":
		play_synth(sfx_chaka)
	elif type == "don":
		play_synth(sfx_don)

# タイミング判定ポップアップエフェクト
func spawn_timing_popup(text, color):
	var label = Label.new()
	label.text = text
	label.add_color_override("font_color", color)
	label.rect_position = Vector2(400 - 50, 150)
	label.align = Label.ALIGN_CENTER
	label.valign = Label.VALIGN_CENTER
	label.rect_scale = Vector2(1.5, 1.5)
	$UI.add_child(label)
	
	var tween = Tween.new()
	add_child(tween)
	tween.interpolate_property(label, "rect_position", label.rect_position, label.rect_position - Vector2(0, 40), 0.45, Tween.TRANS_QUAD, Tween.EASE_OUT)
	tween.interpolate_property(label, "modulate", Color.white, Color(1,1,1,0), 0.45, Tween.TRANS_QUAD, Tween.EASE_OUT)
	tween.start()
	
	yield(tween, "tween_all_completed")
	label.queue_free()
	tween.queue_free()

# 敵遭遇時／戦闘終了時のテンポ・音色変調
func change_bpm(new_bpm):
	bpm = new_bpm
	beat_interval = 60.0 / bpm
	
	# BGMの停止
	if bgm_player != null:
		bgm_player.stop()
		
	# テンポの速さに応じてメトロノーム音のピッチ（周波数）を変更
	var click_freq = 600
	if bpm > 140:
		click_freq = 800
	elif bpm < 110:
		click_freq = 450
		
	sfx_beat = create_synth_stream(click_freq, 0.03, "click")
	
	# ドラム音の長さ（減衰速度）をBPMに同期させ、音の切れを最適化
	var dur_mult = 120.0 / float(bpm)
	sfx_pata = create_synth_stream(120, 0.18 * dur_mult, "kick")
	sfx_pon = create_synth_stream(220, 0.16 * dur_mult, "fm_snare")
	sfx_chaka = create_synth_stream(0, 0.04 * dur_mult, "hat")
	sfx_don = create_synth_stream(150, 0.20 * dur_mult, "kick")
	
	# 新しいBPMループを合成して再生開始！
	if bgm_player != null:
		var bgm_stream = generate_bgm_loop(bpm)
		bgm_player.stream = bgm_stream
		bgm_player.play()
		last_total_beats = 0
	
	print("BPM 変調 -> ", bpm, " (BGMループ再生開始、インターバル: ", beat_interval, ")")

# 🎹 シンセBGMループ動的合成エンジン (1小節ループ)
func generate_bgm_loop(target_bpm):
	var sample = AudioStreamSample.new()
	sample.format = AudioStreamSample.FORMAT_8_BITS
	sample.loop_mode = AudioStreamSample.LOOP_FORWARD
	sample.mix_rate = 11025
	
	# 4拍分 (1小節) の正確な秒数
	var loop_duration = (60.0 / target_bpm) * 4.0
	var num_samples = int(11025 * loop_duration)
	
	sample.loop_begin = 0
	sample.loop_end = num_samples
	
	var bytes = PoolByteArray()
	bytes.resize(num_samples)
	
	var beat_len = loop_duration / 4.0
	
	for i in range(num_samples):
		var t = float(i) / 11025.0
		var val = 0.0
		
		# 1. 4つ打ちテクノキック (各拍の頭でドンドンと響く)
		var t_beat = fmod(t, beat_len)
		var kick_env = exp(-t_beat * 32.0)
		var kick_freq = 45.0 + (160.0 - 45.0) * exp(-t_beat * 45.0)
		var kick_wave = sin(2.0 * PI * kick_freq * t_beat) * kick_env * 70.0
		val += kick_wave
		
		# 2. オフビート・サイバーベース (裏拍で「ドゥン」と刻む)
		var t_eighth = fmod(t, beat_len / 2.0)
		var eighth_idx = int(t / (beat_len / 2.0))
		var is_offbeat = (eighth_idx % 2 == 1)
		
		if is_offbeat:
			# A -> C -> G -> F マイナーコード進行
			var base_freq = 55.0 # A1
			var step = eighth_idx / 2
			if step == 1: base_freq = 65.4 # C2
			elif step == 2: base_freq = 49.0 # G1
			elif step == 3: base_freq = 43.6 # F1
			
			var bass_env = exp(-t_eighth * 18.0)
			var bass_wave = (sin(2.0 * PI * base_freq * t_eighth) + 0.4 * sin(2.0 * PI * base_freq * 2.0 * t_eighth)) * bass_env * 40.0
			val += bass_wave
			
		# 3. ハイハット (裏拍で「チッ」と刻む)
		if is_offbeat:
			var hat_env = exp(-t_eighth * 65.0)
			var hat_wave = (randf() * 2.0 - 1.0) * hat_env * 12.0
			val += hat_wave
			
		var final_val = int(clamp(val, -120.0, 120.0))
		bytes.set(i, final_val + 128)
		
	sample.data = bytes
	return sample
