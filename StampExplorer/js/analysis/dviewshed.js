/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：对动态视域进行控制
 * 注意事项：该文件方法仅为动态视域使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 *****************************************************************/
var earth = "";
var analysis;
var COLOR_16_REGEXP = /^0x[0-9a-fA-F]{8}$/;
// 获取当前三维球
function getEarth(earthObj) {
	earth = earthObj;
	analysis = earth.analysisObj;
	var doc = earth.ifEarth.document,
		d = earth.doc,
		balloon = earth.htmlBallon;
	var vs, curTrack;

	var dMgr = new Stamp.Dynamic(earth);
	// 初始化用户数据
	function initUi() {
		$('#dRole').empty();
		dMgr.getList(function(list) {
			var i, len = list.Count,
				dynamic;
			for(i = 0; i < len; i++) {
				dynamic = list.Items(i);
				$('#dRole').append($('<option value="' + dynamic.Name + '">' + dynamic.Name + '</option>'));
			}
		});
	}
	// 创建视域路线
	function createViewshed(pos, angleH, angleV, height, radius, shadowColor, noShadowColor) {
		var viewshed = earth.Factory.CreateViewShed(earth.Factory.CreateGUID(), ""),
			offset = earth.Factory.CreateVector3();
		offset.X = 0;
		offset.Y = Number(height);
		offset.Z = 0.5;
		viewshed.BeginUpdate();
		viewshed.PosOffset = offset;
		viewshed.SphericalTransform.SetLocationEx(pos.Longitude, pos.Latitude, pos.Altitude + 1);
		viewshed.FovH = Number(angleH);
		viewshed.FovV = Number(angleV);

		viewshed.Radius = Number(radius);
		viewshed.ShadowColor = parseInt(shadowColor);
		viewshed.NoShadowColor = parseInt(noShadowColor);
		viewshed.EnableAssistantCone = chkCone.checked;
		viewshed.EndUpdate();
		earth.AttachObject(viewshed);
		return viewshed;
	}
	$(function() {
		initUi();
		earth.Event.OnHtmlBalloonFinished = function() {
			if(curTrack){
				dMgr.stopTrack(curTrack);
				chkLoop.checked = false;
			}
		};
		// 视锥体显隐
		$("#chkCone").click(function() {
			if($(this).attr("checked") == "checked") {
				if(vs) {
					vs.Visibility = true;
				}

			} else {
				if(vs) {
					vs.Visibility = false;
				}
			}
		});
		// 开始按钮
		$("#btnStart").click(function() {
			debugger
			if(check()) {
				var name = $('#dRole').val(),
					angleH = $('#angleH').val(),
					angleV = $('#angleV').val(),
					radius = $('#radius').val(),
					height = $('#height').val(),
					speed = $("#speed").val(),
					shadowColor = $('#shadowColor').val() || '#ff0000',
					shadowColor = "0x99" + shadowColor.substr(1, 6),
					noShadowColor = $('#noShadowColor').val() || '#00ff00';
				noShadowColor = "0x99" + noShadowColor.substr(1, 6);
				dMgr.track({
					name: name,
					flyHeight: $('#pathheight').val(),
					speed: speed,
					visible: true,
					autoClear: false,
					document: doc,
					onBefore: function(track, guid) {
						var dObj = earth.DynamicSystem.GetSphericalObject(guid);
						vs = createViewshed(track.GetPose(0), angleH, angleV, height, radius, shadowColor, noShadowColor);
						dObj.AttachObject(vs);
						curTrack = track;
						$('#btnStart').prop('disabled', true);
						$('#btnPause').prop('disabled', false);
					},
					onFinish: function(track, guid) {
						if(chkLoop.checked) {
							curTrack.BindObject = guid;
							curTrack.Play(false);
						} else {
							dMgr.deleteTrack(curTrack);
							var dObj = earth.DynamicSystem.GetSphericalObject(guid);
							if(dObj) {
								dObj.DetachObject(vs);
							}
							earth.DetachObject(vs);
							vs = null;
							curTrack = null;
						}
					},
					onEnd: function() {
						$('#btnStart').prop('disabled', false);
						$('#btnPause').prop('disabled', true);
						$('#btnPause').text("暂停");
					}
				});
			}
		});
		// 暂停事件
		$("#btnPause").click(function() {
			if($("#btnPause").text() == "暂停") {
				$("#btnPause").text("继续");
			} else {
				$("#btnPause").text("暂停");
			}
			if(curTrack.Status == 1) {
				dMgr.pauseTrack(curTrack);
			} else if(curTrack.Status == 2) {
				dMgr.resumeTrack(curTrack);
			}
		});
		// 清除事件
		$("#clear").click(function() {
			if(curTrack) {
				dMgr.stopTrack(curTrack);
				chkLoop.checked = false;
			}
		});
	});

	window.onunload = function() {
		if(!!curTrack && !!vs) {
			dMgr.deleteAllTrack();
			earth.DetachObject(vs);
		}
		analysis.clear();
	};
}
// 输入值不能为空
function check() {
	if(isNaN($("#angleH").val()) == true) {
		alert("无效的视角");
		return false;
	}
	if(isNaN($("#height").val()) == true) {
		alert("无效的高度");
		return false;
	}
	if(isNaN($("#speed").val()) == true) {
		alert("无效的速度");
		return false;
	}
	return true;
}