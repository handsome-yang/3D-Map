/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：区域监测文件areaMonitor
 * 注意事项：该文件方法仅为区域监测使用
 * 遗留bug ：无
 * 修改日期：2017年11月07日
 *****************************************************************/

var earth = null;
var demArr = [];
var legalDemArr = []; //合法的工程与DEM图层数组
var thisProject = null;
var diffPolygon = null; //监测多边形
var minMax = null;
var analysis = null; //分析方法库

/**
 * 程序入口,使用外部气泡的Invokescript驱动
 * @param  {[object]} earthObj [三维球对象]
 * @return 无
 */
function getEarth(earthObj) {
	earth = earthObj;
	demArr = earth.demArr;
	var projectId = earth.projectId;
	initProject(demArr);
	initBeforSlide();
	initAfterSlide();
	analysis = STAMP.Analysis(earth);
}
/**
 * 点击颜色控件并且填充颜色在对应的input框里
 * @param  {[str]} id [input框的id]
 * @return {[type]}    [description]
 */
function fillColorDlg(id) {
	var sColor = null;
	var buttonNode = document.getElementById(id);
	if(buttonNode.previousSibling.previousSibling) {
		var inputNode = buttonNode.previousSibling.previousSibling;
	} else if(buttonNode.previousSibling) {
		var inputNode = buttonNode.previousSibling;
	} else {
		var inputNode = buttonNode;
	}
	sInitColor = inputNode.value;
	if(sInitColor == null) {
		sColor = dlgHelper.ChooseColorDlg();
	} else {
		sColor = dlgHelper.ChooseColorDlg(sInitColor);
	}
	sColor = sColor.toString(16);
	if(sColor.length < 6) {
		var sTempString = "00000000".substring(0, 6 - sColor.length);
		sColor = sTempString.concat(sColor);
	}
	sColor = "#" + sColor;
	if(id.indexOf("Sel") > -1) {
		var newId = id;
	} else {
		var newId = id.replace(/(fillColor)(.*)/, '$1Sel$2');
	}
	document.getElementById(newId).style["backgroundColor"] = sColor;
	inputNode.value = sColor;
}

$(function() {
	$("#tableLines").mCustomScrollbar();
	$("#slopeTable td").css({
		"width": "60px",
		"white-space": "nowrap",
		"overflow": "hidden",
		"word-break": "keep-all"
	});
	/**
	 * 工程名称切换事件
	 * 对监测地形1和2刷新
	 */
	$("#project").change(function() {
		$("#beforSlide").empty();
		$("#afterSlide").empty();
		initBeforSlide();
		initAfterSlide();
	});
	/**
	 * 监测地形1切换事件
	 * 切换后要保证监测地形2和1不一样
	 */
	$("#beforSlide").change(function() {
		var beforDem = $("#beforSlide").val();
		var afterDem = $("#afterSlide").val();
		if(beforDem == afterDem) {
			var beforIndex = $('option:selected', '#beforSlide').index();
			initAfterSlide(beforIndex);
		} else {
			return;
		}
	});
	/**
	 * 监测地形2切换事件
	 * 切换后要保证监测地形2和1不一样
	 */
	$("#afterSlide").change(function() {
		var beforDem = $("#beforSlide").val();
		var afterDem = $("#afterSlide").val();
		if(beforDem == afterDem) {
			var afterIndex = $('option:selected', '#afterSlide').index();
			initAfterSlide(afterIndex);
		} else {
			return;
		}
	});
	// 绘制按钮
	$("#draw").click(function() {
		var strGuid1 = $("#beforSlide").val();
		var strGuid2 = $("#afterSlide").val();
		//记录设置的颜色
		var setColor = [];
		$(".colorInput").each(function() {
			setColor.push(this.value);
		});
		analysis.difference(params.ip, strGuid1, strGuid2, setColor);
	});
	$("#sectionBtn").click(function() {
		analysis.section();
	});
	/**
	 * 区域分析开始
	 */
	$("#btnStart").click(function() {
		analysis.colorPolygon(differencePolygon);
	});
	/**
	 * 退出点击事件
	 */
	$("#clear").click(function() {
		analysis.clear();
		if(earth.htmlBallon) { //清除气泡
			earth.htmlBallon.DestroyObject();
			earth.htmlBallon = null;
		}
	});
	/**
	 * 选择路径点击事件
	 */
	$("#selectFile").click(function() {
		var path = earth.UserDocument.SaveFileDialog("", "*.jpg|*.JPG", "jpg");
		if(!path) {
			return;
		}
		$("#filePath").val(path);
	})
	window.onunload = function() {
		analysis.clear();
	}
})