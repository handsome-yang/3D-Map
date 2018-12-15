/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：爆管分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
/**
 * 屏蔽右键菜单
 */
document.oncontextmenu = function() {
	event.returnValue = false;
};

var earth = null;
earth = top.LayerManagement.earth;
var projectId = top.SYSTEMPARAMS.project;
var layer = earth.LayerManager.GetLayerByGUID(projectId);
var pipeLineLayers = top.SystemSetting.getPipeListByLayer(layer);
setDivHeight();
$(function() {
	var selObj = null;
	var billboardPos = {}; // 管段中心点坐标：{X: x, Y: y, Z: z}
	var burstObj = null; // 爆管动态图片对象
	var layerGUID = ""; // 管段所属图层的GUID
	var objGUID = ""; // 选中管线的GUID

	var btnAnalyzeEnabled = function() {
		if($("#txtObjId").val() != "") {
			$("#btnAnalyze").attr("disabled", false);
			$("#btnFlyToPipe").attr("disabled", false);
		} else {
			$("#btnAnalyze").attr("disabled", true);
			$("#btnFlyToPipe").attr("disabled", true);
		}
	};
	$("#txtObjId").change(function() {
		btnAnalyzeEnabled();
	});

	/**
	 * 解析查询结果，添加到结果表格中
	 * @param result 查询结果
	 * @param guid 图层ID
	 */
	var lineObjArr = [];
	var parseResult = function(result, guid, type) {
		var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
			'><td class="col1">$INDEX</td><td class="col2">$DISPLAYTYPE</td></tr>';
		var records = result.Record;
		var displayType = "管线";
		var nameType = 1;
		if(type == "point") {
			displayType = "阀门";
			nameType = 0;
		}
		if(result.num <= 0) {
			return;
		} else if(result.num == 1) {
			$("#tblResult>tbody").append(template.replace("$INDEX", records[top.getNameNoIgnoreCase("US_KEY", nameType, true)])
				.replace("$DISPLAYTYPE", displayType)
				.replace("$LayerID", guid.split("_")[0])
				.replace("$TYPE", type)
				.replace("$GUID", "")
				.replace("$KEY", records[top.getNameNoIgnoreCase("US_KEY", nameType, true)]));
			lineObjArr.push({
				layerId: guid.split("_")[0],
				type: type,
				guid: "",
				key: records[top.getNameNoIgnoreCase("US_KEY", nameType, true)]
			});
		} else {
			for(var i = 0; i < records.length; i++) {
				$("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", nameType, true)])
					.replace("$DISPLAYTYPE", displayType)
					.replace("$LayerID", guid.split("_")[0])
					.replace("$TYPE", type)
					.replace("$GUID", "")
					.replace("$KEY", records[i][top.getNameNoIgnoreCase("US_KEY", nameType, true)]));
				lineObjArr.push({
					layerId: guid.split("_")[0],
					type: type,
					guid: "",
					key: records[i][top.getNameNoIgnoreCase("US_KEY", nameType, true)]
				});
			}
		}
		$("#importExcelBtn").attr("disabled", false);
		$("#showResult").attr("disabled", false);
		$("#detailData").attr("disabled", false);
	};
	/**
	 * 创建爆管动态图片标志对象
	 */
	var particleObj = null;
	var createBurstObject = function() {
		var layerId = obj.layerGUID.split("_")[0];
		var strRes = "";
		var layer = earth.LayerManager.GetLayerByGUID(layerId);
		if(layer == null) {
			return;
		}
		if(layer.PipeLineType >= 5000 && layer.PipeLineType < 6000) { // fire 燃气类管线
			createParticle(0);
		} else if(layer.PipeLineType >= 3000 && layer.PipeLineType < 4000) { // water 给水
			createParticle(3);
		} else if(layer.PipeLineType >= 6000 && layer.PipeLineType < 6100) { //  //热力/蒸汽
			createParticle(4);
		} else if(layer.PipeLineType >= 6100 && layer.PipeLineType < 7000) { // 热水
			createParticle(3);
		} else if(layer.PipeLineType >= 7000 && layer.PipeLineType < 7200) { // 工业类
			createParticle(1);
		} else if(layer.PipeLineType >= 7200) {
			createParticle(0);
		} else {
			return;
		}
	};
	// 创建粒子对象
	var createParticle = function(type) {
		var guid = earth.Factory.CreateGuid();
		var particle = earth.factory.CreateElementParticle(guid, "particle");
		particle.Underground = true;
		particle.SphericalTransform.SetLocationEx(obj.X, obj.Y, obj.Z);
		particle.BeginUpdate();
		particle.Type = type; //   火 = 0,  烟 = 1,  喷泉 = 2, 直流水枪 = 3,   喷雾水枪 = 4
		particle.EndUpdate();

		earth.AttachObject(particle);
		particleObj = particle;

	};
	/**
	 * 重置到初始状态
	 */
	var reset = function() {

		var layer = earth.LayerManager.GetLayerByGUID(obj.layerGUID.split("_")[0]);
		if(layer != null) {
			layer.ClearSearchResult();
		}
		billboardPos = {};
		if(burstObj != null) {
			earth.DetachObject(burstObj);
			burstObj = null;
		}
		obj.layerGUID = "";
		obj.objGUID = "";
		$("#txtObjId").val("");
		selObj = null;
	};
	// 选取管段
	$("#btnSelectPipe").click(function() {
		//todo:排除不能做爆管的管线

		if($("#showResult").attr("checked") == "checked" || $("#showResult").attr("checked") == true) {
			if(lineObjArr.length > 0) {
				analysisShowResult(false, lineObjArr, null, ["Equipment", "Well"]);
				$("#showResult").attr("checked", false);
			}
		}
		earth.focus();
		var checkExist = burstAnalysisSelectObj($("#txtObjId"), $("#btnAnalyze"), 0, "", true);
		if(!checkExist) {
			$("#btnAnalyze").attr("disabled", true);
		}
	});
	// 分析按钮
	$("#btnAnalyze").click(function() {
		divload("tablediv");
		if($("#showResult").attr("checked") == true || $("#showResult").attr("checked") == "checked") {
			if(lineObjArr.length > 0) {
				analysisShowResult(false, lineObjArr, null, ["Equipment", "Well"]);
				$("#showResult").attr("checked", false);
			}
		}

		if(particleObj) {
			earth.DetachObject(particleObj);
			particleObj = null;
		}
		lineObjArr = [];
		$("#showResult").removeAttr("checked");
		createBurstObject();
		var strConn = earth.LayerManager.GetLayerByGUID(obj.layerGUID.split("_")[0]).GISServer +
			"network?rt=burst&service=" + obj.layerGUID.split("_")[0];
		strConn += "&aparam=0," + obj.key;
		earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
			if(pRes.ExcuteType == top.SystemSetting.excuteType) {
				var xmlStr = pRes.AttributeName;
				var xmlDoc = loadXMLStr(xmlStr);
				$("#tblResult>tbody").empty();
				var json = $.xml2json(xmlDoc);
				if(json == null || !json.BurstResult) {
					return;
				}
				var result = json.BurstResult.LineResult;
				parseResult(result, obj.layerGUID, "line");
				result = json.BurstResult.PointResult;
				parseResult(result, obj.layerGUID, "point");
				if("" == $("#tblResult>tbody").text()) {
					alert("分析结果为空！");
				}
				divloaded();
			}
		}
		earth.DatabaseManager.GetXml(strConn);
	});
	/**
	 * 功能：【导出Excel】按钮onclick事件
	 */
	$("#importExcelBtn").click(function() {
		var tabObj = $("#tblResult>tbody")[0];
		var columns = ["编号", "类型"];
		StatisticsMgr.importExcelByTable(tabObj, columns);
	});
	$(window).unload(function() {
		var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
		if(checkTag) {
			analysisShowResult(false, lineObjArr, null, ["Equipment", "Well"]);
		}
		if(particleObj) {
			earth.DetachObject(particleObj);
			particleObj = null;
		}
		StatisticsMgr.detachShere();
		analysisClearBuffer();
		clearHighLight();
	});
	$("#showResult").click(function() {
		var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
		analysisShowResult(checkTag, lineObjArr, null, ["Equipment", "Well"]);
	});
	//显示详细信息
	$("#detailData").click(function() {
		bShow = $('input:checkbox[name="detailData"]').is(":checked");
		if(!bShow) {
			top.LayerManagement.clearHtmlBalloons();
		}
	});
});