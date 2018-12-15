/**
 * 作    者：StampGIS Team
 * 创建日期：2018年 1月 16日
 * 描    述：StampGIS相关功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2018年 1月 16日
 ******************************************/

var earth;
var dom;

//初始化
$(function() {
	earth = window.dialogArguments;
	$("#selectFile1").click(function() {
		var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "config文件(*.config)|*.config");
		if(filePath) { //打开文件并填入文本框
			$("#settingFile").val(filePath);
		}
	});

	$("#selectFile2").click(function() {
		var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "config文件(*.shp)|*.shp");//excel格式后面再支持：|excel文件(*.excel)|*.xls
		if(filePath) { //打开文件并填入文本框
			$("#dataFile").val(filePath);
		}
	});

	$("#cancel").click(function() {
		window.close();
	});

	$("#confirm").click(function() {
		var dataFile = $("#dataFile").val();
		var settingFile = $("#settingFile").val();
		if(!dataFile || !settingFile) {
			alert("请先选择文件！");
			return;
		}
		//读取配置文件
		settingImport(settingFile);
		var result = false;
		if(dataFile.lastIndexOf(".shp") > 0) {
			//执行导入SHP数据的功能
			result = importSHP(dataFile);
		} else if(dataFile.lastIndexOf(".xls") > 0) {
			//解析Excel-暂时未用到，备用
			result = ReadExcel(dataFile);
		}
		if(result){
			window.returnValue = true;
			window.close();
		}else{
			alert("导入失败！");
		}
	});

});

/**
 * 解析Excel - 暂时未用到，后面再用
 * @param {Object} filePath
 */
function ReadExcel(filePath) {
	var tempStr = "";

	//创建操作EXCEL应用程序的实例
	var oXL = new ActiveXObject("Excel.application");
	//打开指定路径的excel文件
	var oWB = oXL.Workbooks.open(filePath);
	//操作第一个sheet(从一开始，而非零)
	oWB.worksheets(1).select();
	var oSheet = oWB.ActiveSheet;

	//使用的行数
	var rows = oSheet.usedrange.rows.count;
	try {
		for(var i = 2; i <= rows; i++) {
			if(oSheet.Cells(i, 2).value == "null" || oSheet.Cells(i, 3).value == "null") break;

			var a = oSheet.Cells(i, 2).value.toString() == "undefined" ? "" : oSheet.Cells(i, 2).value;

			tempStr += (" " + oSheet.Cells(i, 2).value + " " + oSheet.Cells(i, 3).value + " " + oSheet.Cells(i, 4).value + " " + oSheet.Cells(i, 5).value + " " + oSheet.Cells(i, 6).value + "\n");
		}
	} catch(e) {
		alert("Excel数据读取有误，请使用SHP文件导入！");
	}

	//退出操作excel的实例对象
	oXL.Application.Quit();
	//手动调用垃圾收集器
	CollectGarbage();
}

//读取配置文件
function settingImport(settingFile) {
	var xmlData = earth.UserDocument.loadXmlFile(settingFile); //得到xml数据；调用接口读取配置文件
	dom = loadXMLStr(xmlData);
	top.dom = dom;
}

//导入shp
function importSHP(shpFile) {
	try{

		var dataProcess = document.getElementById("dataProcess");
		dataProcess.Load();
		var oGRDataProcess = dataProcess.OGRDataProcess;
		//通过shp的type获得shp的驱动
		var driver = oGRDataProcess.GetDriverByType(44);
		//通过该驱动打开shp文件
		var dataSource = driver.Open(shpFile, 0);

		var layer, feature, type, featureDefn, tempType;
		var deviceID, deviceType, depressionAngle, elevationAngle, rotationAngle, longitude, latitude;

		for(var i = 0; i < dataSource.GetLayerCount(); i++) {
			//获得图层信息
			layer = dataSource.GetLayer(i);
			//遍历该图层里面所有的记录数
			for(var j = 0; j < layer.GetFeatureCount(); j++) {
				feature = layer.GetFeature(j);
				type = layer.GetGeometryType();

				if(type === 1 || type === 401) { //点

					featureDefn = feature.GetFeatureDefn(); //属性行

					deviceID = getName(dom, "DeviceID", "Devicelist", 0, 2); //设备编号
					deviceType = getName(dom, "DeviceType", "Devicelist", 0, 2); //设备类型
					depressionAngle = getName(dom, "DepressionAngle", "Devicelist", 0, 2); //俯角
					elevationAngle = getName(dom, "ElevationAngle", "Devicelist", 0, 2); //仰角
					rotationAngle = getName(dom, "RotationAngle", "Devicelist", 0, 2); //旋转角
					longitude = getName(dom, "Longitude", "Devicelist", 0, 2); //经度
					latitude = getName(dom, "Latitude", "Devicelist", 0, 2); //纬度

					depressionAngle = feature.GetFieldAsString(featureDefn.GetFieldIndex(depressionAngle));
					elevationAngle = feature.GetFieldAsString(featureDefn.GetFieldIndex(elevationAngle));
					rotationAngle = feature.GetFieldAsString(featureDefn.GetFieldIndex(rotationAngle));
					longitude = feature.GetFieldAsString(featureDefn.GetFieldIndex(longitude));
					latitude = feature.GetFieldAsString(featureDefn.GetFieldIndex(latitude));
					deviceID = feature.GetFieldAsString(featureDefn.GetFieldIndex(deviceID));
					deviceType = feature.GetFieldAsString(featureDefn.GetFieldIndex(deviceType)); //0为球机， 1为枪机

					if(deviceType.indexOf("球") > 0) {
						tempType = 0;
					} else if(deviceType.indexOf("枪机") > 0) {
						tempType = 1;
					}

					//调用接口导入数据
					earth.Gb28181CameraManager.Gb28181Server = top.params.ip;
					var result = earth.Gb28181CameraManager.SetCameraAngleAndPosition(deviceID, depressionAngle, elevationAngle, rotationAngle, longitude, latitude, tempType);
					var jsonResult = $.xml2json(result);
					if(jsonResult == "SetCameraInfo succeed"){//保存到数据库中
						return true;
					}else{
						return false;
					}
				}
			}
		}

		return true;
	}catch(ex){
		return false;
	}
}