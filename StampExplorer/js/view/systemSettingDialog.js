/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：系统设置相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/
var earth = null; //全局球
$(function() {
	var params = window.dialogArguments; //接收页面参数
	earth = params.earth;
	/**
	 * 功能：初始化文本框值域
	 * 参数：无
	 * 返回值：无
	 */
	function initProjectList() {
		var pipeProjectList = [];
		var rootLayerList = earth.LayerManager.LayerList;
		var projectCount = rootLayerList.GetChildCount();
		for(var i = 0; i < projectCount; i++) {
			var childLayer = rootLayerList.GetChildAt(i);
			var layerType = childLayer.LayerType;
			if(layerType === "Project") { //17
				var projectId = childLayer.Guid;
				var projectName = childLayer.Name;
				var chlildrenCount = childLayer.GetChildCount();
				var pipeTag = true;
				if(pipeTag) {
					pipeProjectList.push({
						id: projectId,
						name: projectName
					});
				}
			}
		}
		return pipeProjectList;
	}

	/**
	 * 初始化文本框
	 */
	function initList() {
		var layer = earth.LayerManager.LayerList;
		var projectList = initProjectList();
		if(projectList != null) {
			var count = projectList.length;
			for(var i = 0; i < count; i++) {
				var project = projectList[i];
				var option = '<option value="' + project.id + '">' + project.name + '</option>';
				$("#projectList").append(option);
			}
		}
		$("#projectList").val(params.project);
		$("#viewPoint").val(params.Position);
		if(params.balloonAlpha > 0) {
			$('#chkBalnAlpha')[0].checked = true;
		} else {
			$('#chkBalnAlpha')[0].checked = false;
		}
	}
	initList(); //初始化文本框
	$("#projectList").change(function() {
		var layerId = $("#projectList").val();
		if(!layerId) {
			return;
		}
		var ProLayer = earth.LayerManager.GetLayerByGUID(layerId);
		var alt = 0;
		if(ProLayer) {
			alt = ProLayer.ProjectSetting.UnderRefAlt;
		}
		$("#alt").val(alt);
	});
	$("#projectList").trigger("change");

	/**
	 * 功能：获取当前视角
	 * 参数：无
	 * 返回值：无
	 */
	$("#setViewPoint").click(function() {
		var obj = {};
		obj.longitude = earth.GlobeObserver.TargetPose.Longitude;
		obj.latitude = earth.GlobeObserver.TargetPose.Latitude;
		obj.altitude = earth.GlobeObserver.TargetPose.Altitude;
		obj.tilt = earth.GlobeObserver.Pose.Tilt;
		obj.heading = earth.GlobeObserver.Pose.Heading;
		obj.roll = earth.GlobeObserver.Pose.Roll;
		obj.range = earth.GlobeObserver.Pose.Range;
		var viewPoint = obj.longitude + "," + obj.latitude + "," + obj.altitude + "," + obj.tilt + "," + obj.heading + "," + obj.roll + "," + obj.range;
		$("#viewPoint").val(viewPoint);
	});
	/**
	 * 功能：【确定】按钮onclick事件
	 * 参数：无
	 * 返回值：无
	 */
	$("#confirmBtn").click(function() {
		params.project = $("#projectList").val();
		params.Alt = $("#alt").val();
		params.Position = $("#viewPoint").val();
		params.balloonAlpha = $('#chkBalnAlpha')[0].checked ? 1 : 0;
		window.returnValue = params;
		window.close();
	});
});