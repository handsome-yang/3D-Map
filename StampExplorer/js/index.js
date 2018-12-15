/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月7日
 * 描    述：最外层页面脚本，包括全局变量和方法
 * 注意事项：可存放全局的变量或方法
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 */

/*全局变量*/
var SYSTEMPARAMS = {}; //系统参数对象
var earthToolsDiv = null; //工具栏
var earthToolsBalloon = null; //工具栏气泡
var earth = null; //全局三维球对象
var excuteType = 27; //getxml查询的正常返回类型值
var userdata = null; //全局用户对象工具
var analysis = null; //全局三维分析工具
var isShowHistory = false; //是否显示历史滚动条
var picturesBalloons = null; //编辑对话框、截屏出图等
var seHistorySliderMgr = null; //查看历史slider
var SetDemcrazySliderMgr = null; //地形夸张slider;
var bSync = false; //两球联动
var cameraLayer = null; //视频监控新增图层
var cameras = []; //所有视频监控对象集合
var isUserdataTree = false; //面板打开是否加载了三级菜单面板，如果已加载，则需要同步三级面板上的树节点
var globalSearchLayer = null; //上一次搜索的图层
var mapTwoObj = $("#MapTwo"); //三维球载体对象
var ballonFlag = 0; //控制起气泡工具条的变化
var headerHeight = 70; //标题栏高度
var dialogLeft = Math.ceil(86 * zoomInit); //弹出框靠左距离

/*-------------标题栏样式 START--------------------*/
$(".logoImg").attr("src", STAMP_config.topInfo.logo);
if(STAMP_config.topInfo.titleImg && STAMP_config.topInfo.titleImg != "") { //标题栏图片不为空，则显示图片
	$(".titleImg").attr("src", STAMP_config.topInfo.titleImg);
	$(".titleText").hide();
	$(".titleImg").show();
} else { //标题栏图片为空，则显示文字
	$(".titleText").text(STAMP_config.topInfo.titleText);
	$(".titleImg").hide();
	$(".titleText").show();
}
/*-------------标题栏样式 END--------------------*/

/**
 * 重要方法：三维球加载完成后初始化方法
 */
function init() {
	SystemSetting.initSystemParam(earth); //初始化系统参数
	LayerManagement.initLayerDataType(earth, null);
	baseLayerTree(earth); // 将基本图层数据添加到左侧树
	userdata = STAMP.Userdata(earth);
	userdata.initTree(); //初始化用户树
	analysis = STAMP.Analysis(earth);
	initMenu(); //初始化菜单栏
	showEarthTools(); //显示工具栏

	//地形夸张slider初始化
	SetDemcrazySliderMgr = new STAMP.SetDemcrazySliderMgr({
		onAllClose: function() {
			Tools.singleStyleCancel("demExagger");
		}
	});

	//查看历史slider初始化
	seHistorySliderMgr = new STAMP.SeHistorySliderMgr({
		onAllClose: function() {
			Tools.singleStyleCancel("historyData");
		}
	});
	resizeEarthWidth();
}

/**
 * 获取数据处理object对象：空间参考等
 * @return {[object]} [lib_data_util接口对象]
 */
function getDataProcessIndex() {
	var dataProcess = document.getElementById("dataProcess");
	return dataProcess;
}

/**
 * 获取功能面板opendialog的frame
 * @return {[type]} [description]
 */
function getOperObject() {
	try {
		return window.frames["operator"];
	} catch(e) {
		return;
	}
}

/**
 * 获取ResultView对象，目前只有视点在此
 * @return {[type]} [description]
 */
function getViewObject() {
	try {
		return window.frames["ResultMain"];
	} catch(e) {
		return;
	}
}

/*-----------------页面布局相关 START----------------------*/
/*
页面自适应布局
包括：系统主界面排版、三维球、左侧面板等
 */
var earthToolHeightTemp = 0; //工具栏临时高度
function resizeEarthToolWindow() { //工具栏重新调整窗口
	if (earthToolsBalloon && Math.ceil($("#earthDiv").height() * getZoom()) < earthToolHeight) {
        var temHeight = parseInt((Math.ceil($("#earthDiv").height() * getZoom()) - 32 - (22 * zoomInit)) / (67 * zoomInit)) * (67 * zoomInit) + 32 + (22 * zoomInit);
        earthToolsBalloon.SetRectSize(earthToolWidth, temHeight);
        earthToolHeightTemp = temHeight;
    } else if (earthToolsBalloon && earthToolHeightTemp < earthToolHeight) {
        earthToolsBalloon.SetRectSize(earthToolWidth, earthToolHeight);
    }
}
/**
 * 重新设置工具条的大小,因为earth的高度变大的时候不会去重绘，所以采取这样一种方法
 */
function resizeEarthTool(ballonHeightNow) {
	earthToolsBalloon.SetRectSize(earthToolWidth, ballonHeightNow || earthToolHeight);
	ballonFlag = !ballonFlag;
	if(ballonFlag) {
		$("#MapTwo").height(earth.clientHeight + 1);
	} else {
		$("#MapTwo").height(earth.clientHeight - 1);
	}
}

/**
 * 重绘左侧窗体
 * @return {[type]} [description]
 */
function resizeLeftPanel() {
	$("#mainDiv").height($(window).height() - headerHeight);
	$("#MapTwo").height($("#mainDiv").height() - ($("#viewpointMain").is(":hidden") ? 0 : 135) - 40);
	$("#id_tree_body").height($("#id_left_layerTree").height() - $("#layerHeader").height() - $("#layer_title").height());
	if($("#id_left_operator").is(":visible")) {
		$("#id_left_operator").panel({
			height: $(window).height() - headerHeight
		});
	}
}

/**
 * 窗口大小改变事件
 * @return {[type]} [description]
 */
window.onresize = function() {
	resizeLeftPanel();
	setToolsIconStatus();
	resizeEarthToolWindow();

	resizeEarthWidth();
}

function resizeEarthWidth(){
	if($("#MapTwo").width() % 2 == 1){
		$("#map3dv").width($("#MapTwo").width() - 1);
	}else{
		$("#map3dv").width($("#MapTwo").width());
	}
}

resizeLeftPanel(); //重绘左侧面板

//加载滚动条
$("#id_tree_body").mCustomScrollbar({});

/**
 * 隐藏球下方的图
 * @return {[type]} [description]
 */
function hideProfile() {
	ViewPointManagementBtn = false;
	$("#ResultMain").show();
	$("#profileChart").hide();
	var profileHeight = $("#viewpointMain").height();
	if($("#viewpointMain").css("display") != "none") {
		Tools.singleStyleCancel("ViewPointManagement");
		setTableView(false, profileHeight);
	}
}

//设置视点面板是否显示show:true显示，show:false不显示
function setTableView(show, height) {
	if(!height) {
		height = 135;
	}
	$("#viewpointMain").height(height);
	if(show) {
		$("#viewpointMain").css("height", height)
		$("#viewpointMain").show();
		$("#MapTwo").height($("#MapTwo").height() - height);
	} else {
		$("#MapTwo").height($("#MapTwo").height() + height);
		$("#viewpointMain").hide();
	}
		resizeEarthToolWindow();
}
/**
 * 设置气泡可见性
 * @param {Boolean} isVisible [是否可见]
 */
function setBalloonVisible(isVisible){
	if(top.LayerManagement.htmlBalloon) {
		top.LayerManagement.htmlBalloon.SetIsVisible(isVisible);
	}
	if(earthToolsBalloon) {
		earthToolsBalloon.SetIsVisible(isVisible);
	}
	if(htmlBalloonMove) {
		htmlBalloonMove.SetIsVisible(isVisible);
	}
	if(picturesBalloons) {
		picturesBalloons.SetIsVisible(isVisible);
	}
	for(var i=0; i < bolonArr.length; i++){
		if(bolonArr[i]){
			bolonArr[i].SetIsVisible(isVisible);
		}
	}
}
/**
 * 针对ie10+可以用的显示或者隐藏气泡                                                       [description]
 */
try{//ie9以下addEventListener会报错，所以需要加上try,catch
	document.addEventListener("visibilitychange",function(){
		if(document.hidden){
			setBalloonVisible(false);
		} else {
			setBalloonVisible(true);
		}
	});
}catch(e){
}

/**
 * 设置左侧图层面板是否显示show:true显示，show:false不显示
 * @param {[bool]} show [是否显示]
 */
function setLayerShow(show) {
	bLayerVisible = show;

	if(show) {
		$("#leftPanel").show();
		$("#mainEarth").css("margin-left", "255px");
		$("#id_tree_body").height($("#id_left_layerTree").height() - $("#layerHeader").height() - $("#layer_title").height());

		if(dialogId) {
			closeDialog();
		}
	} else {
		if(dialogId) {
			BalloonHtml.setItemStyle("LayerManager");
			bLayerVisible = true;
			closeDialog();
			return;
		}
		$("#leftPanel").hide();
		$("#mainEarth").css("margin-left", "0px");
	}
	var scrollOrder = show ? "" : "destroy"; //隐藏div的时候将其中的自定义的滚动条去掉,不然会影响性能
	$("#id_tree_body").mCustomScrollbar(scrollOrder);
	setToolsIconStatus();
}

/*-----------------页面布局相关 END----------------------*/
//系统配置对象
var SystemSetting = {
	excuteType:27,
	/**
	 * 功能：初始化系统参数对象
	 * 参数：无
	 * 返回值：无
	 */
	initSystemParam: function(earth) {
		if(SYSTEMPARAMS) {
			SYSTEMPARAMS = this.getSystemConfig();
		}
		if(SYSTEMPARAMS.project != "") {
			if(SYSTEMPARAMS.Position != "" && SYSTEMPARAMS.Position) {
				var longitude = SYSTEMPARAMS.Position.split(",")[0];
				var latitude = SYSTEMPARAMS.Position.split(",")[1];
				var altitude = SYSTEMPARAMS.Position.split(",")[2];
				var tilt = SYSTEMPARAMS.Position.split(",")[3];
				var heading = SYSTEMPARAMS.Position.split(",")[4];
				var roll = SYSTEMPARAMS.Position.split(",")[5];
				var range = SYSTEMPARAMS.Position.split(",")[6];
				earth.GlobeObserver.GotoLookat(longitude, latitude, altitude, heading, tilt, roll, range);
			}
			var layer = earth.LayerManager.GetLayerByGUID(SYSTEMPARAMS.project);
			if(layer) {
				//服务端属性配置开始！
				var projectSetting = layer.ProjectSetting;
				var layerLink = projectSetting.PipeConfigFile; //管线配置文件
				var fieldMap = projectSetting.FieldMapFile; //字段映射配置文件
				var valueMap = projectSetting.ValueMapFile; //值域映射文件
				var spatialRef = projectSetting.SpatialRefFile; //空间参考文件
				if (fieldMap != "") {
	                var filedPath = "";
	                if (fieldMap.indexOf("http") >= 0) {
	                    filedPath = fieldMap;
	                } else {
	                    filedPath = "http://" + fieldMap.substr(2).replace("/", "/sde?/") + "_sde";
	                }
	                SYSTEMPARAMS.pipeFieldMapUrl = filedPath;

	                if (chkFile(filedPath)) {
	                    //管线字段映射
	                    earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
	                        if (pRes.ExcuteType == SystemSetting.excuteType) {
	                            SYSTEMPARAMS.pipeFieldMap = loadXMLStr(pRes.AttributeName); //初始化编码映射文件对象
	                        }
	                        if (layerLink != "") {
	                            var configUrl = "";
	                            if (layerLink.indexOf("http") >= 0) {
	                                configUrl = layerLink;
	                            } else {
	                                configUrl = "http://" + layerLink.substr(2).replace("/", "/sde?/") + "_sde";
	                            }
	                            SYSTEMPARAMS.pipeConfigLink = layerLink;
	                            if (chkFile(configUrl)) {
	                                //管线配置
	                                earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
	                                    if (pRes.ExcuteType == SystemSetting.excuteType) {
	                                        SYSTEMPARAMS.pipeConfigDoc = loadXMLStr(pRes.AttributeName); //初始化管线字段映射文件
	                                    }
	                                    if (valueMap != "") {
	                                        var vPath = "";
	                                        if (valueMap.indexOf("http") >= 0) {
	                                            vPath = valueMap;
	                                        } else {
	                                            vPath = "http://" + valueMap.substr(2).replace("/", "/sde?/") + "_sde";
	                                        }

	                                        if (chkFile(vPath)) {
	                                            //valueMap配置
	                                            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
	                                                if (pRes.ExcuteType == SystemSetting.excuteType) {
	                                                    SYSTEMPARAMS.valueMap = loadXMLStr(pRes.AttributeName); //初始化编码映射文件对象
	                                                }
	                                                //自定义字段 fieldMap.config
	                                                var pipeConfigLink = SYSTEMPARAMS.pipeConfigLink;
	                                                if (pipeConfigLink) {
	                                                    var configUrl = "";
	                                                    if (pipeConfigLink.indexOf("http") >= 0) {
	                                                        configUrl = pipeConfigLink;
	                                                    } else {
	                                                        configUrl = "http://" + pipeConfigLink.substr(2).replace("/", "/sde?/").replace("PipeConfig.config", "FieldMap.config") + "_sde";
	                                                    }

	                                                    earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
	                                                        if (pRes.ExcuteType == SystemSetting.excuteType) {
	                                                            var xmlStr = pRes.AttributeName;
	                                                            var systemDoc = loadXMLStr(xmlStr);
	                                                            if (systemDoc === null) {
	                                                                return;
	                                                            }
	                                                            var jsonData = $.xml2json(systemDoc);
	                                                            if (jsonData.LineFieldMap && jsonData.LineFieldMap.UserDefine) {
	                                                                var fieldItem = jsonData.LineFieldMap.UserDefine.FieldMapItem;
	                                                                var captionAry = [];
	                                                                var aliasNameAry = [];
	                                                                for (var i = 0; i < fieldItem.length; i++) {
	                                                                    var fieldMapitem = fieldItem[i].FieldName;
	                                                                    var fieldAliasName = fieldItem[i].FieldAliasName;
	                                                                    captionAry.push(fieldMapitem);
	                                                                    aliasNameAry.push(fieldAliasName);
	                                                                }
	                                                                customLineFields.push(captionAry, aliasNameAry);
	                                                            }
	                                                            if (jsonData.PointFieldMap && jsonData.PointFieldMap.UserDefine) {
	                                                                var fieldItem = jsonData.PointFieldMap.UserDefine.FieldMapItem;
	                                                                var captionAry = [];
	                                                                var aliasNameAry = [];
	                                                                for (var i = 0; i < fieldItem.length; i++) {
	                                                                    var fieldMapitem = fieldItem[i].FieldName;
	                                                                    var fieldAliasName = fieldItem[i].FieldAliasName;
	                                                                    captionAry.push(fieldMapitem);
	                                                                    aliasNameAry.push(fieldAliasName);
	                                                                }
	                                                                customPointFields.push(captionAry, aliasNameAry);
	                                                            }
	                                                        }
	                                                    }
	                                                    earth.DatabaseManager.GetXml(configUrl);
	                                                }
	                                            }
	                                            earth.DatabaseManager.GetXml(vPath);
	                                        }
	                                    } else {
	                                        SYSTEMPARAMS.valueMap = "";
	                                    }
	                                }
	                                earth.DatabaseManager.GetXml(configUrl);
	                            }
	                        } else {
	                            SYSTEMPARAMS.pipeConfigDoc = "";
	                        }
	                    }
	                    earth.DatabaseManager.GetXml(filedPath);
	                }
	            } else {
	                SYSTEMPARAMS.pipeFieldMap = "";
	            }

				if(spatialRef != "") {
					if(/http/ig.test(spatialRef.substring(0, 4))) {
						var spatialUrl = spatialRef;
					} else {
						var spatialUrl = "http://" + spatialRef.substr(2).replace("/", "/sde?/") + "_sde";
					}
					if(spatialUrl != "") {
						SYSTEMPARAMS.pipeDatum = CoordinateTransform.createDatum(spatialUrl);
						SYSTEMPARAMS.spatialUrl = spatialUrl;
						earth.Event.OnDocumentUpdate = function(res) {
							//修改坐标显示单位 如果当前工程范围内 就转坐标 否则显示经纬度
							var earthPose = earth.GlobeObserver.TargetPose;
							var lon = earthPose.Longitude;
							var lat = earthPose.Latitude;
							var alt = earth.GlobeObserver.Pose.Altitude;
							if(!SYSTEMPARAMS.pipeDatum) {
								SYSTEMPARAMS.pipeDatum = CoordinateTransform.createDatum(spatialUrl);
							}
							var pXY = SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(lon, lat, alt);
							var layerBounds = layer.ProjectSetting.LonLatRect;
							var layerMaxHeight = layerBounds.MaxHeight; //图层的最大可见高度
							if(alt <= (layerMaxHeight + 10000) && lon >= layerBounds.West && lon <= layerBounds.east && lat >= layerBounds.South && lat <= layerBounds.North) {
								earth.Environment.UseLocalCoord = true;
								earth.Environment.SetLocalCoord(pXY.x, pXY.y);
							} else {
								earth.Environment.UseLocalCoord = false;
							}
						}
					}
				} else {
					SYSTEMPARAMS.pipeDatum = "";
				}
			}
		} else {
			SYSTEMPARAMS.pipeConfigDoc = "";
			SYSTEMPARAMS.pipeDatum = "";
			SYSTEMPARAMS.pipeFieldMap = "";
		}
	},

	/**
	 * 功能：初始化系统配置文件内容
	 * 参数：无
	 * 返回值：初始化的系统配置文件内容
	 */
	initSystemConfig: function(id) {
		var configXml = '<xml>';
		if(id) {
			configXml = configXml + '<Project>' + id + '</Project>'; //project
		} else {
			configXml = configXml + '<Project></Project>'; //project
		}
		configXml = configXml + '<Position></Position></xml>';
		return configXml;
	},

	/**
	 * 功能：获取系统配置参数
	 * 参数：无
	 * 返回值：系统配置参数
	 */
	getSystemConfig: function() {
		var rootPath = earth.Environment.RootPath + "temp\\SystemConfig";
		var configPath = rootPath + ".xml";
		var configXml = earth.UserDocument.LoadXmlFile(configPath);
		if(configXml === "") {
			configXml = this.initSystemConfig();
			earth.UserDocument.SaveXmlFile(rootPath, configXml);
		}
		var systemDoc = loadXMLStr(configXml);
		var systemJson = $.xml2json(systemDoc);
		if(systemJson == null) {//防止xml格式错误导致系统无法正常运行
			configXml = SystemSetting.initSystemConfig();
            SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, configXml);
            systemDoc = loadXMLStr(configXml);
            systemJson = $.xml2json(systemDoc);
            if(systemJson == null){
                alert("客户端sysytemconfig.xml格式错误");
                return;
            }
		}
		if(systemJson.Project == "" || systemJson.Project.length != 36 || systemJson.Position == null) { //如果工程不存在，默认选第一个
			var pipeProjArr = SystemSetting.getProjectList();
			if(pipeProjArr.length > 0) {
				var obj = {
					project: pipeProjArr[0].id
				};
				earth.UserDocument.DeleteXmlFile(configPath);
				var newXml = this.initSystemConfig(pipeProjArr[0].id);
				earth.UserDocument.SaveXmlFile(rootPath, newXml);
			}

		}
		var systemData = {};
		systemData.project = systemJson.Project;
		systemData.Position = systemJson.Position;
		if(typeof systemJson.poiLayerId != 'undefined' && systemJson.poiLayerId != null) {
			systemData.poiLayerId = systemJson.poiLayerId;
		}
		systemData.balloonAlpha = systemJson.BalloonAlpha;
		return systemData;
	},

	/**
	 * 功能：设置系统配置参数
	 * 参数：systemData-系统配置参数
	 * 返回值：无
	 */
	setSystemConfig: function(systemData) {
		var rootPath = earth.Environment.RootPath + "temp\\SystemConfig";
		var configPath = rootPath + ".xml";
		var configXml = earth.UserDocument.LoadXmlFile(configPath);
		var systemDoc = loadXMLStr(configXml);
		var root = systemDoc.documentElement;
		(root.getElementsByTagName("Project")[0]).text = systemData.project;
		(root.getElementsByTagName("Position")[0]).text = systemData.Position;
		if(root.getElementsByTagName("poiLayerId").length == 0) {
			newel = systemDoc.createElement('poiLayerId');
			newtext = systemDoc.createTextNode('');
			newel.appendChild(newtext);
			root.appendChild(newel);
		}
		if(systemData.poiLayerId != null) {
			(root.getElementsByTagName("poiLayerId")[0]).text = systemData.poiLayerId;
		}

		if(root.getElementsByTagName('BalloonAlpha').length == 0) {
			var bn = systemDoc.createElement('BalloonAlpha');
			var bt = systemDoc.createTextNode('');
			bn.appendChild(bt);
			root.appendChild(bn);
		}
		if(systemData.balloonAlpha != null) {
			root.getElementsByTagName('BalloonAlpha')[0].text = systemData.balloonAlpha;
		}
		earth.UserDocument.SaveXmlFile(rootPath, systemDoc.xml);
	},

	/**
	 * 功能：获得项目列表
	 * 参数：无
	 * 返回值：项目列表
	 */
	getProjectList: function() {
		var projectList = [];
		var rootLayerList = earth.LayerManager.LayerList;
		var projectCount = rootLayerList.GetChildCount();
		for(var i = 0; i < projectCount; i++) {
			var childLayer = rootLayerList.GetChildAt(i);
			var layerType = childLayer.LayerType;
			var pipeTag = false;
			if(layerType === "Project" && !pipeTag) { //17
				var projectId = childLayer.Guid;
				var projectName = childLayer.Name;
				var chlildrenCount = childLayer.GetChildCount();
				projectList.push({
					id: projectId,
					name: projectName
				});
			}
		}
		return projectList;
	}

};
var chkFile = function (fileURL) {
    //Todo:暂时不能直接判断是否存在,直接返回true
    return true;
}
/**
 * 坐标转换对象创建
 * @type {Object}
 */
var CoordinateTransform = {
	sysDatum: null, //系统内部的坐标转换对象

	/**
	 * 功能：获取系统内部的坐标转换对象
	 */
	getSystemDatum: function() {
		if(this.sysDatum == null) {
			this.sysDatum = this.createDatum();
		}
		return this.sysDatum;
	},

	getRootPath: function() {
		var pathName = window.document.location.pathname;
		var localhost = window.location.host;
		var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
		return(localhost + projectName);
	},

	/**
	 * 功能：创建空间坐标转换对象
	 */
	createDatum: function(spatialUrl) {
		var projectId = SYSTEMPARAMS.project;
		var projLayer = SystemSetting.earth.LayerManager.GetLayerByGUID(projectId);
		var spatialUrl = projLayer.ProjectSetting.SpatialRefFile;
		if(this.sysDatum) {
			return this.sysDatum;
		}
		var filePath = SystemSetting.earth.Environment.RootPath + "\\temp\\spatialFile";
		SystemSetting.earth.UserDocument.SaveFile(spatialUrl, "spatialFile");
		var dataProcess = top.getDataProcessIndex();
		dataProcess.Load();
		var spatial = dataProcess.CoordFactory.CreateSpatialRef();
		spatial.InitFromFile(filePath);
		SystemSetting.earth.UserDocument.DeleteFile(filePath);
		var datum = dataProcess.CoordFactory.CreateDatum();
		datum.Init(spatial);
		this.sysDatum = datum;
		return datum;
	}
};

/*********************************全局方法 START*******************************************/
/**
 * 显示气泡（截屏、出图、旋转、缩放、移动）
 * @param  {[type]} tag           [气泡类型]
 * @param  {[type]} sAltitudeType [渲染模式：正常、贴地、贴模型]
 * @return {[type]}               [description]
 */
function pictureHtml(tag, sAltitudeType) {
	var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
	var url = "";
	var dval;
	var width = 270,
		height = 240;
	if(tag === "mScreenShot") { //截屏
		url = loaclUrl + "/html/view/screenShot.html";
		dval = earth;
		height = 260;
		width = 355;
	} else if(tag === "pictures") { //出图
		url = loaclUrl + "/html/view/pictures.html";
		dval = earth;
		height = 395;
		width = 413;
	} else if(tag === "move") { //移动
		url = loaclUrl + "/html/userdata/objectEdit.html?action=move";
		dval = earth;
		height = 226;
		width = 274;
		dval.cameraArr = cameraArr;
		dval.editDataArr = editDataArr;
	} else if(tag === "scale") { //缩放
		url = loaclUrl + "/html/userdata/objectEdit.html?action=scale";
		dval = earth;
		height = 226;
		width = 274;
		dval.cameraArr = cameraArr;
		dval.editDataArr = editDataArr;
	} else if(tag === "rotate") { //旋转
		url = loaclUrl + "/html/userdata/objectEdit.html?action=rotate";
		dval = earth;
		height = 226;
		width = 274;
		dval.cameraArr = cameraArr;
		dval.editDataArr = editDataArr;
	}
	clearGlobalBalloons(); //弹出气泡前先清除之前的全局气泡
	picturesBalloons = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), "屏幕坐标窗体URL");
	picturesBalloons.SetScreenLocation(width / 2 + top.dialogLeft, 0);
	picturesBalloons.SetRectSize(width, height);
	picturesBalloons.SetIsAddBackgroundImage(false);
	picturesBalloons.ShowNavigate(url);

	//加载页面内容，传入外部参数
	earth.Event.OnDocumentReadyCompleted = function(guid) {
		dval.htmlBallon = picturesBalloons; //气泡对象传入页面中
		if(picturesBalloons.Guid = guid) {
			picturesBalloons.InvokeScript("setTranScroll", dval);
			picturesBalloons.InvokeScript("altitudetype", sAltitudeType);
		}
	};

	//气泡关闭事件
	Stamp.Tools.OnHtmlBalloonFinishedFunc(picturesBalloons.Guid, function(id) {
		if(picturesBalloons != null && id === picturesBalloons.Guid) {
			picturesBalloons.DestroyObject();
			picturesBalloons = null;
			dval.ShapeCreator.Clear();
		}
	});
};

/**
 * 弹出可拖动气泡
 * @param  {[type]} id [气泡ID]
 * @return {[type]}    [description]
 */
function showMoveHtmlBalloon(id) {
	if(analysis == null) {
		analysis = STAMP.Analysis(LayerManagement.earth);
	}
	analysis.showMoveHtml(id);
}

/**
 * 判断编辑的是摄像头还是element
 * @param  {[type]} editFlag [编辑类型]
 * @return {[type]}          [description]
 */
var editCameraOrElement = function(editFlag) {
	showEditBalloon(editFlag);

	//选择对象改变的事件
	earth.Event.OnselectChanged = function() {
		showEditBalloon(editFlag);
		earth.Event.OnselectChanged = function() {};
	}
}

/**
 * 显示编辑气泡
 * @param  {[type]} editFlag [编辑类型]
 * @return {[type]}          [description]
 */
var showEditBalloon = function(editFlag) {
	var selectSet = earth.SelectSet;
	var bShow = true; //是否显示
	var sAltitudeType = true; //是否是贴地的模型
	for(var i = 0; i < selectSet.GetCount(); i++) {
		var element = selectSet.GetObject(i);
		if(element.Aspect) { //宽高比例
			bShow = false;
		}
		if(element.AltitudeType == "1" || element.AltitudeType == "5") { //1：正常；5：贴模型
			sAltitudeType = false;
		}

		if(element.Rtti == 238) { //摄像头模型
			if(editFlag == 'move') {
				sAltitudeType = true;
			} else {
				sAltitudeType = false;
			}
		}
	}

	//下面是显示编辑的气泡
	if(bShow && earth.selectSet.GetCount() != 0) {
		if(editFlag === "move") { //移动
			pictureHtml("move", sAltitudeType);
		} else if(editFlag === "scale") { //缩放
			pictureHtml("scale", sAltitudeType);
		} else if(editFlag === "rotate") { //旋转
			pictureHtml("rotate", sAltitudeType);
		}
	}
}

/**
 * 清除全局气泡
 * @return {[type]} [description]
 */
function clearGlobalBalloons() {
	if(picturesBalloons != null) {
		picturesBalloons.DestroyObject();
		picturesBalloons = null;
	}
	if(htmlBalloonMove != null) {
		htmlBalloonMove.DestroyObject();
		htmlBalloonMove = null;
	}
}

/**
 * 清除上次搜索图层的缓存数据
 * @param  {[type]} currentLayer [本次即将搜索的图层]
 * @return {[type]}              [description]
 */
var clearSearchResult = function(currentLayer) {
	if(top.globalSearchLayer != null) {
		top.globalSearchLayer.ClearSearchResult();
	}
	top.globalSearchLayer = currentLayer;
}

/**
 * 地形剖面图
 * @param  {[type]} xCategories [X轴值]
 * @param  {[type]} serieList   [要生成图表的数据]
 * @param  {[type]} POINTARR    [剖面分析每个点的数据数组]
 * @return {[type]}             [description]
 */
function showProfile(xCategories, serieList, POINTARR) {
	$("#ResultMain").hide();
	$("#profileChart").show();
	var profileHeight = $("#MapTwo").height() / 2;
	setTableView(true, profileHeight);
	createChart(xCategories, serieList, POINTARR);
}

/**
 * 单点监测
 * @param  {[type]} xCategories [x轴注记]
 * @param  {[type]} minValue    [Y轴最小值]
 * @param  {[type]} serieList   [图表数据]
 * @param  {[type]} maxValue    [Y轴最大值]
 * @param  {[type]} pointArray  [原数据结果：所有点集]
 * @return {[type]}             [图表对象]
 */
function showPointMonitor(xCategories, minValue, serieList, maxValue, pointArray) {
	$("#ResultMain").hide();
	$("#profileChart").show();
	var profileHeight = $("#MapTwo").height() / 2;
	setTableView(true, profileHeight);
	createPointMonitor(xCategories, minValue, serieList, maxValue, pointArray);
}

/**
 * 断面监测
 * @param  {[type]} xCategories [x轴注记]
 * @param  {[type]} minValue    [Y轴最小值]
 * @param  {[type]} serieList   [图表数据]
 * @param  {[type]} maxValue    [Y轴最大值]
 * @param  {[type]} resultObj  [原数据结果：每个DEM图层返回的结果]
 * @return {[type]}             [图表对象]
 */
function showSectionMonitor(xCategories, serieList, minValue, maxValue, resultObj) {
	$("#ResultMain").hide();
	$("#profileChart").show();
	var profileHeight = $("#MapTwo").height() / 2;
	setTableView(true, profileHeight);
	createSectionMonitor(xCategories, minValue, serieList, maxValue, resultObj);
}

//地形剖面图绘制
function createChart(xCategories, serieList, POINTARR) {
	var minValue = null;
	var maxValue = null;
	for(var i = 0; i < serieList.length; i++) {
		var dataList = serieList[i].data;
		for(var k = 0; k < dataList.length; k++) {
			var dataValue = dataList[k];
			if(minValue == null) {
				minValue = dataValue;
			} else {
				if(dataValue < minValue) {
					minValue = dataValue;
				}
			}
			if(maxValue == null) {
				maxValue = dataValue;
			} else {
				if(dataValue > maxValue) {
					maxValue = dataValue;
				}
			}
		}
	}
	var tickIntervalValue = 1;
	tickIntervalValue = Math.ceil(xCategories.length / 20);
	var chart = new Highcharts.Chart({
		chart: {
			renderTo: 'profileChart',
			reflow: false,
			type: "areaspline",
			zoomType: 'xy', //xy均可以鼠标拖动缩放
			margin: [50, 50, 50, 70]
		},
		credits: {
			enabled: false
		},
		title: {
			text: '地形剖面图'
		},
		xAxis: {
			title: {
				text: '样点'
			},
			tickInterval: tickIntervalValue, //控制X轴步长
			allowDecimals: false, //X轴不允许有小数标值
			categories: xCategories, //X轴标值列表
			labels: {
				rotation: -45,
				align: 'right'
			}
		},
		yAxis: {
			title: {
				text: '高程(米)'
			},
			min: minValue,
			max: maxValue,
			allowDecimals: false
		},
		tooltip: {
			formatter: function() {
				if(POINTARR == null) {
					return;
				}
				var index = (this.x - 1) * 4;
				var lon = POINTARR[index];
				var lat = POINTARR[index + 1];
				var alt = this.y;
				var formatStr = '<b>样点' + this.x + ': <br/>';
				formatStr = formatStr + '经度: ' + lon + '<br/>';
				formatStr = formatStr + '纬度: ' + lat + '<br/>';
				formatStr = formatStr + '高程: ' + alt + '</b>';
				return formatStr;
			}
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			series: {
				animation: false, //初始化时，是否有动画效果
				cursor: 'pointer',
				events: {
					click: function(e) {
						if(POINTARR == null) {
							return;
						}
						var index = (e.point.x) * 4;
						var lon = POINTARR[index];
						var lat = POINTARR[index + 1];
						var alt = e.point.y;
						seearth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 90, 0, 100, 5);
					}
				},
				marker: {
					enabled: false,
					states: {
						hover: {
							enabled: true,
							radius: 3
						}
					}
				}
			}
		},
		series: serieList,
		exporting: {
			enabled: false
		}
	});
	return chart;
}

/**
 * 单点监测图绘制
 * @param  {[type]} xCategories [x轴注记]
 * @param  {[type]} minValue    [最小值]
 * @param  {[type]} serieList   [要展示的数据列表]
 * @param  {[type]} maxValue    [最大值]
 * @param  {[type]} pointArray  [原数据结果]
 * @return {[type]}             [图表对象]
 */
function createPointMonitor(xCategories, minValue, serieList, maxValue, pointArray) {
	var chart = new Highcharts.Chart({
		chart: {
			renderTo: 'profileChart',
			reflow: false,
			zoomType: 'xy', //xy均可以鼠标拖动缩放
			margin: [50, 50, 50, 70]
		},
		title: {
			text: '单点监测图'
		},
		xAxis: {
			title: {
				text: "dem图层"
			},
			categories: xCategories //X轴标值列表
		},
		yAxis: {
			title: {
				text: '高程(米)'
			},
			min: minValue,
			max: maxValue,
			plotLines: [{
				value: 0,
				width: 1,
				color: '#808080'
			}]
		},
		tooltip: {
			formatter: function() {
				if(pointArray == null) {
					return;
				}
				var thisLineName = this.series.name;
				if(!thisLineName) {
					return;
				}
				var index = 0;
				for(var i = 0; i < serieList.length; i++) {
					if(serieList[i].name == thisLineName) {
						index = i;
						break;
					}
				}
				var thisPoint = pointArray[index].split(",");
				var longitude = thisPoint[0];
				var latitude = thisPoint[1];
				var altitude = this.y.toFixed(6);
				if(!longitude || !latitude) {
					return;
				}
				var formatStr = '<b>监测点' + this.x + ': <br/>';
				formatStr = formatStr + '经度: ' + longitude + '<br/>';
				formatStr = formatStr + '纬度: ' + latitude + '<br/>';
				formatStr = formatStr + '高程: ' + altitude + '</b>';
				return formatStr;
			}
		},
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0
		},
		plotOptions: {
			series: {
				animation: false, //初始化时，是否有动画效果
				cursor: 'pointer',
				events: {
					click: function(e) {
						if(pointArray == null) {
							return;
						}
						var thisLineName = this.name;
						var index = 0;
						for(var i = 0; i < serieList.length; i++) {
							if(serieList[i].name == thisLineName) {
								index = i;
								break;
							}
						}
						var thisPoint = pointArray[index].split(",");
						var longitude = thisPoint[0];
						var latitude = thisPoint[1];
						if(!longitude || !latitude) {
							return;
						}
						var altitude = e.point.y;
						seearth.GlobeObserver.FlytoLookat(longitude, latitude, altitude, 0, 90, 0, 50, 5);
					}
				},
				marker: {
					enabled: false,
					states: {
						hover: {
							enabled: true,
							radius: 3
						}
					}
				}
			}
		},
		series: serieList,
		exporting: {
			enabled: false
		}
	});
}

/**
 * 断面监测图绘制
 * @param  {[type]} xCategories [x轴注记]
 * @param  {[type]} minValue    [最小值]
 * @param  {[type]} serieList   [要展示的数据列表]
 * @param  {[type]} maxValue    [最大值]
 * @param  {[type]} resultObj   [原数据结果]
 * @return {[type]}             [description]
 */
function createSectionMonitor(xCategories, minValue, serieList, maxValue, resultObj) {
	var tickIntervalValue = 1;
	tickIntervalValue = Math.ceil(xCategories.length / 20);
	var chart = new Highcharts.Chart({
		chart: {
			renderTo: 'profileChart',
			reflow: false,
			zoomType: 'xy', //xy均可以鼠标拖动缩放
			margin: [50, 50, 50, 70]
		},
		title: {
			text: '断面监测图'
		},
		xAxis: {
			title: {
				text: "样点"
			},
			tickInterval: tickIntervalValue, //控制X轴步长
			allowDecimals: false, //X轴不允许有小数标值
			categories: xCategories //X轴标值列表
		},
		yAxis: {
			title: {
				text: '高程(米)'
			},
			min: minValue,
			max: maxValue,
			plotLines: [{
				value: 0,
				width: 1,
				color: '#808080'
			}]
		},
		tooltip: {
			formatter: function() {
				if(resultObj == null) {
					return;
				}
				var thisLineName = this.series.name;
				var thisData = null;
				for(var i = 0; i < resultObj.length; i++) {
					if(resultObj[i].name == thisLineName) {
						thisData = resultObj[i].pointArr;
						break;
					}
				}
				if(!thisData) {
					return;
				}
				var index = this.x - 1
				var longitude = thisData[index][0];
				var latitude = thisData[index][1];
				var altitude = this.y.toFixed(6);
				var formatStr = '<b>样点' + this.x + ': <br/>';
				formatStr = formatStr + '经度: ' + longitude + '<br/>';
				formatStr = formatStr + '纬度: ' + latitude + '<br/>';
				formatStr = formatStr + '高程: ' + altitude + '</b>';
				return formatStr;
			}
		},
		legend: {
			layout: 'vertical',
			align: 'right',
			verticalAlign: 'middle',
			borderWidth: 0
		},
		plotOptions: {
			series: {
				animation: false, //初始化时，是否有动画效果
				cursor: 'pointer',
				events: {
					click: function(e) {
						if(resultObj == null) {
							return;
						}
						var thisLineName = this.name;
						var thisData = null;
						for(var i = 0; i < resultObj.length; i++) {
							if(resultObj[i].name == thisLineName) {
								thisData = resultObj[i].pointArr;
								break;
							}
						}
						if(!thisData) {
							return;
						}
						var index = e.point.x;
						var lon = thisData[index][0];
						var lat = thisData[index][1];
						var alt = e.point.y;
						seearth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 90, 0, 50, 5);
					}
				},
				marker: {
					enabled: false,
					states: {
						hover: {
							enabled: true,
							radius: 3
						}
					}
				}
			}
		},
		series: serieList,
		exporting: {
			enabled: false
		}
	});
	return chart;
}

/*********************************全局方法 END*******************************************/