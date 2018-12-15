/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：系统设置相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/
var earth = null; //全局earth
var layerManager = null; //图层管理对象
var MultiSampleType = ""; //各项异性过滤??
var WaterWaveScale = ""; //水面波纹比例
var WaterColor = ""; //水面颜色
var ShowLogo = ""; //显示产品Logo
var ShowNavigator = ""; //显示导航
var ShowProvider = ""; //显示产品
var InformationLan = ""; //显示中文，英文
var ShowInfomation = ""; //显示信息栏
var CenterPointEnable = ""; //显示屏幕中心
var LonLatLineEnable = ""; //显示经纬圈

/**
 * 界面初始化
 */
function init() {
	var xmldata = earth.UserDocument.LoadXmlFile(earth.RootPath.substr(0, earth.RootPath.lastIndexOf("root")) + "config.ini");
	var initData = xmldata.split("\r\n");
	for(var i = 0; i < initData.length; i++) {
		var thisArr = initData[i].split("=");
		if(thisArr.length < 2) {
			continue;
		}
		if(thisArr[0].toLowerCase() == "downloadsleeptime") {
			downloadSleepTime = thisArr[1];
		} else if(thisArr[0].toLowerCase() == "multisampletype") {
			MultiSampleType = thisArr[1];
			$("#anisotropicfiltering").val(MultiSampleType);
		} else if(thisArr[0].toLowerCase() == "waterwavescale") {
			WaterWaveScale = thisArr[1];
			WaterWaveScale = WaterWaveScale ? parseFloat(WaterWaveScale).toFixed(2) : "";
			$("#watertype").val(WaterWaveScale);
		} else if(thisArr[0].toLowerCase() == "watercolor") {
			WaterColor = thisArr[1];
			WaterColor = WaterColor.toString(16);
			WaterColor = WaterColor.substr(4, 6);
			$("#watercolor").val("#" + WaterColor);
			$("#watercolorsel").css("backgroundColor", "#" + WaterColor);
		} else if(thisArr[0].toLowerCase() == "showlogo") {
			ShowLogo = thisArr[1];
			if(ShowLogo == 1) {
				$("#isshowlogo").attr("checked", "checked");
			} else {
				$("#isshowlogo").removeAttr("checked");
			}
		} else if(thisArr[0].toLowerCase() == "shownavigator") { //显示导航
			ShowNavigator = thisArr[1];
			if(ShowNavigator == 1) {
				$("#isshownavigation").attr("checked", "checked");
			} else {
				$("#isshownavigation").removeAttr("checked");
			}
		} else if(thisArr[0].toLowerCase() == "showprovider") { //显示供应商
			ShowProvider = thisArr[1];
			if(ShowProvider == 1) {
				$("#isshowprovider").attr("checked", "checked");
			} else {
				$("#isshowprovider").removeAttr("checked");
			}
		} else if(thisArr[0].toLowerCase() == "informationlanguage") { //显示中文 英文
			InformationLan = thisArr[1];
			if(InformationLan == 1) {
				$("input[name='selectword']").get(0).checked = true;
			} else {
				$("input[name='selectword']").get(1).checked = true;
			}
		} else if(thisArr[0].toLowerCase() == "showinformation") { //显示信息栏
			ShowInfomation = thisArr[1];
			if(ShowInfomation == 1) {
				$("#isshowinformation").attr("checked", "checked");
			} else {
				$("#isshowinformation").removeAttr("checked");
			}
		} else if(thisArr[0].toLowerCase() == "centerpointenable") { //显示屏幕中心
			CenterPointEnable = thisArr[1];
			if(CenterPointEnable == 1) {
				$("#iscenter").attr("checked", "checked");
			} else {
				$("#iscenter").removeAttr("checked");
			}
		} else if(thisArr[0].toLowerCase() == "lonlatlineenable") { //显示经纬圈
			LonLatLineEnable = thisArr[1];
			if(LonLatLineEnable == 1) {
				$("#istransitcircle").attr("checked", "checked");
			} else {
				$("#istransitcircle").removeAttr("checked");
			}
		} else if(thisArr[0].toLowerCase() == "keypower") { //主光源强度
			var mainlightintensity = thisArr[1];
			mainlightintensity = mainlightintensity ? parseFloat(mainlightintensity).toFixed(2) : "";
			$("#mainlightintensity").val(mainlightintensity);
		} else if(thisArr[0].toLowerCase() == "fillpower1") {
			var auxiliarylightintensityone = thisArr[1];
			auxiliarylightintensityone = auxiliarylightintensityone ? parseFloat(auxiliarylightintensityone).toFixed(2) : "";
			$("#auxiliarylightintensityone").val(auxiliarylightintensityone);
		} else if(thisArr[0].toLowerCase() == "fillpower2") {
			var auxiliarylightintensitytwo = thisArr[1];
			auxiliarylightintensitytwo = auxiliarylightintensitytwo ? parseFloat(auxiliarylightintensitytwo).toFixed(2) : "";
			$("#auxiliarylightintensitytwo").val(auxiliarylightintensitytwo);
		}
	}
}
$(function() {
	var params = top.SYSTEMPARAMS;
	earth = top.LayerManagement.earth;
	//保存设置并实现
	$("#confirmBtn").click(function() {
		//是否显示导航
		var isshownavigation = $("#isshownavigation").is(':checked');
		//控制是否显示导航
		earth.Environment.SetNavigatorWindowVisibility(isshownavigation);
		//是否显示产品Logo
		var isshowlogo = $("#isshowlogo").is(':checked');
		//控制是否显示产品Logo
		earth.Environment.SetLogoWindowVisibility(isshowlogo);
		var isshowprovider = $("#isshowprovider").is(':checked');
		earth.Environment.SetProviderWindowVisibility(isshowprovider);
		var isInfoVisual = $("#isshowinformation").is(':checked');
		earth.Environment.SetInformationWindowVisibility(isInfoVisual);
		//获取选择语言类型
		var selectwordvalue = $("input[name='selectword']:checked").val();
		//控制显示语言类型
		earth.Environment.SetInformationLanguage(selectwordvalue);
		//是否显示屏幕中心
		var iscenter = $("#iscenter").is(':checked');
		//控制是否显示屏幕中心
		earth.Environment.CenterPointEnable = iscenter;
		//是否显示经纬圈
		var istransitcircle = $("#istransitcircle").is(':checked');
		//控制是否显示经纬圈
		earth.Environment.DrawLonLatLine = istransitcircle;
		//设置主光源强度
		var mainlightintensity = $("#mainlightintensity").val();
		if(isNaN(mainlightintensity) || !mainlightintensity) {
			alert("请设置主光源强度");
			return;
		}
		//设置辅助光源1强度
		var auxiliarylightintensityone = $("#auxiliarylightintensityone").val();
		if(isNaN(auxiliarylightintensityone) || !auxiliarylightintensityone) {
			alert("请设置辅助光源1强度");
			return;
		}
		//设置辅助光源2强度
		var auxiliarylightintensitytwo = $("#auxiliarylightintensitytwo").val();
		if(isNaN(auxiliarylightintensitytwo) || !auxiliarylightintensitytwo) {
			alert("请设置辅助光源2强度");
			return;
		}
		//控制主光源强度  辅助光源1强度 辅助光源2强度
		earth.Environment.KeyLightPower = mainlightintensity;
		earth.Environment.FillLightPower1 = auxiliarylightintensityone;
		earth.Environment.FillLightPower2 = auxiliarylightintensitytwo;
		//获取渲染设置参数
		var anisotropicfiltering = $("#anisotropicfiltering").val();
		earth.Environment.SetMultiSampleType(anisotropicfiltering);
		// 获取水面波纹比例
		var watertype = $("#watertype").val();
		if(isNaN(watertype) || !watertype) {
			alert("请设置水面波纹比例");
			return;
		}
		earth.Environment.WaterWaveScale = watertype;

		// 获取水面波纹颜色
		var watercolor = $("#watercolor").val();
		watercolor = watercolor.substr(1, 6);
		watercolor = "0xff" + watercolor;
		watercolor = parseInt(watercolor);
		earth.Environment.WaterColor = watercolor;
		alert("保存成功！");
	});
	init();
});
