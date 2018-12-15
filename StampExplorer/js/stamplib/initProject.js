/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：初始化工程相关功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 13日
 ******************************************/

/**
 * [getThisDem 检测文本框]
 * @return {[type]} [无]
 */
function getThisDem() {
	var thisProjectId = $("#project").val();
	if(!thisProjectId) {
		alert("请先配置至少有两个DEM图层的工程!");
		$("#btnStart").attr("disabled", true);
		$("#btnAll").attr("disabled", true);
		return;
	}
	for(var i = 0; i < legalDemArr.length; i++) {
		if(legalDemArr[i].id == thisProjectId) {
			thisProject = legalDemArr[i];
			break;
		}
	}
}
/**
 * [initProject 初始化工程]
 * @param  {[Array]} demArr [数组]
 * @return {[type]}        [无]
 */
function initProject(demArr) {
	var legalIdArr = [];
	for(var i = 0; i < demArr.length; i++) {
		if(demArr[i].dem.length > 1) {
			var thisPid = demArr[i].id;
			if($.inArray(thisPid, legalIdArr) < 0) {
				legalIdArr.push(thisPid);
				legalDemArr.push(demArr[i]);
				var str = "<option value='" + demArr[i].id + "'>"
				str += demArr[i].name + "</option>";
				$(str).appendTo("#project");
			}
		}
	}
}
/**
 * [initSlideDem 初始化当前工程地形select型]
 * @return {[type]} [description]
 */
function initSlideDem() {
	getThisDem();
	if(!thisProject) {
		return;
	}
	var str = "";
	for(var i = 0; i < thisProject.dem.length; i++) {
		var thisDemLayer = thisProject.dem[i];
		str += "<option value='" + thisDemLayer.id + "'>";
		str += thisDemLayer.name + "</option>"
	}
	return str;
}
/**
 * [initSlideDem 初始化当前工程地形checkbox型]
 * @return {[type]} [description]
 */
function initDemList() {
	getThisDem();
	if(!thisProject) {
		return;
	}
	var str = "";
	for(var i = 0; i < thisProject.dem.length; i++) {
		var thisDemLayer = thisProject.dem[i];
		str += "<div><input type='checkbox' style='padding-top:8px;' demName ='" + thisDemLayer.name + "' id='demLayer" + i + "' value='" + thisDemLayer.id + "'>";
		str += "<label for='demLayer" + i + "'>" + thisDemLayer.name + "</label><div>"
	}
	$(str).appendTo("#demList");
}
/**
 * [initAfterSlide 初始化监测地形2]
 * @param  {[number]} index [当前选中项下标]
 * @return {[type]}       [无]
 */
function initAfterSlide(index) {
	var optionStr = initSlideDem();
	$("#afterSlide").empty();
	$(optionStr).appendTo("#afterSlide");
	if(index) {
		var thisDemLayer = thisProject.dem.length;
		if(index == (thisDemLayer - 1)) {
			$("#afterSlide").get(0).selectedIndex = 0;
		} else {
			$("#afterSlide").get(0).selectedIndex = index + 1;
		}
	} else {
		$("#afterSlide").get(0).selectedIndex = 1;
	}
}
/**
 * [initBeforSlide 初始化监测地形1]
 * @param  {[number]} index [当前选中项下标]
 * @return {[type]}       [无]
 */
function initBeforSlide(index) {
	var optionStr = initSlideDem();
	$(optionStr).appendTo("#beforSlide");
	if(index) {
		if(index == 0) {
			$("#beforSlide").get(0).selectedIndex = 1;
		} else {
			$("#beforSlide").get(0).selectedIndex = index - 1;
		}
	} else {
		$("#beforSlide").get(0).selectedIndex = 0;
	}
}