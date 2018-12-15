/**
 * 作    者：StampGIS Team
 * 创建日期：2016年12月15日
 * 描    述：风场的主要js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth; //全局earth
$(function() {
	var divHeight = $(parent.document).height() - 435;
	//这里借用Userdata.js里的接口方法实现创建立方体
	var userdata = parent.STAMP.Userdata();
	$("#dgDiv").height(divHeight);
	$("#dgDiv").mCustomScrollbar({}); //设置滚动条样式
	earth = parent.earth;
	var analysis = STAMP.Analysis(earth);
	var wind = []; //风场数组
	$("#select").click(function() {
		var path = earth.UserDocument.OpenFilePathDialog("", "");
		if(!path) {
			return;
		}
		$("#path").val(path);

		var nCount = 0;
		nCount = analysis.GetWindSceneLayersCount($("#path").val());
		var fSubName = new Array();
		for(var i = 0; i < nCount; i++) {
			fSubName[i] = 0;
		}
		analysis.GetWindSceneLayers($("#path").val(), fSubName, nCount);
		fSubName.sort(sortNumber);
		var rootNodes = [];
		var dataRoot = {
			"id": earth.Factory.CreateGuid(),
			"name": path.substr(path.lastIndexOf("\\") + 1, path.length),
			"value": "0",
			"checked": true
		};
		var nodes = [];
		for(var i = 0; i < fSubName.length; i++) {
			var data = {
				"id": earth.Factory.CreateGuid(),
				"name": "第" + fSubName[i] + "层",
				"value": fSubName[i],
				"checked": true
			};
			wind.push(parseInt(fSubName[i]))
			nodes.push(data);
		}
		dataRoot.children = nodes;
		rootNodes.push(dataRoot);
		initTree(rootNodes); //初始化树
		if(wind.length > 0) {
			$("#btnStartAnalysis").attr("disabled", false);
			$("#btnSelect").attr("disabled", false);
		}
		if(wind.length > 0) {
			analysis.windScene($("#path").val(), wind, 0, 0);
		}
	});

	$("#btnStartAnalysis").click(function() {
		var lonOffset = $("#lonOffset").val();
		var latOffset = $("#latOffset").val();
		var windSpeed = $("#windSpeed").val();
		var LZMD = $("#LZMD").val();
		var LZDX = $("#LZDX").val();
		if(lonOffset === "") {
			alert("请填写经度偏移值")
			return;
		}
		if(latOffset === "") {
			alert("请填写纬度偏移值")
			return;
		}
		if(!Number(windSpeed)) {
			alert("请填写大于0的风速倍率");
			return;
		}
		if(!Number(LZMD)) {
			alert("请填写大于0的粒子密度");
			return;
		}
		if(!Number(LZDX)) {
			alert("请填写大于0的粒子大小");
			return;
		}
		if(wind.length > 0) {
			analysis.windScene($("#path").val(), wind, lonOffset, latOffset);
		}
		setTimeout(function() {
			if(windSpeed != "" && !isNaN(windSpeed)) {
				earth.Measure.SetWindSceneVelocityBoost(windSpeed);
			}
			if(LZMD != "" && !isNaN(LZMD)) {
				earth.Measure.SetWindSceneDensity(LZMD);
			}
			if(LZDX != "" && !isNaN(LZDX)) {
				earth.Measure.SetWindSceneSize(LZDX);
			}
		}, 100);
	});
	$("#btnSelect").click(function() {
		earth.Environment.SetCursorStyle(32512);
		earth.Measure.SetQuery(true);
		earth.Event.OnRBDown = function() {
			earth.Environment.SetCursorStyle(209);
			earth.Measure.SetQuery(false);
			earth.Event.OnLBDown = function() {};
		}
	});

	$("#btnSetCurrentLayer").click(function() {
		var iCurrentLayer = $("#CurrentLayer").val();
		earth.Measure.SelectWindSceneLayer(parseInt(iCurrentLayer));
	});
	//查询风场属性方法
	var propertyQueryWindScen = function() {
		var isClicked = false;
		earth.Event.OnLBDown = function(p2) {
			function _onlbdwind(p2) {
				earth.Event.OnLBUp = function(p2) {
					earth.Event.OnLBDown = function(p2) {
						if(!isClicked){
							_onlbdwind(p2);
						}
					};
					var speed = earth.Measure.GetSpeedWE();
					if(speed == 0 || speed == -9999.990234375) {
						earth.Event.OnLBDown = function() {};
						alert("请选择风场面");
					} else {
						userdata.createPrimitives("createwindscene");
						isClicked = true;
					}
				};
			}
			_onlbdwind(p2);
			
		}
	}

	function sortNumber(a, b) {
		return a - b;
	}

	function initTree(nodes) { //初始化树
		var zNodes = nodes;
		var setting = {
			check: {
				enable: true,
				//是否显示checkbox或radio
				chkStyle: "checkbox" //显示类型,可设置(checbox,radio)
			},
			view: {
				dblClickExpand: false,
				//双击节点时，是否自动展开父节点的标识
				expandSpeed: "",
				//节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
				selectedMulti: false //设置是否允许同时选中多个节点
			},
			callback: {
				onClick: function(event, treeId, node) {

				},
				onDblClick: function(event, treeId, node) {
					if(node && node.id) {
						if(node.level == 0) {
							analysis.windScene($("#path").val(), wind);
						} else {
							earth.Measure.SelectWindSceneLayer(parseInt(node.value));
						}
					}
				},
				onCheck: function(event, treeId, node) {
					if(node && node.id) {
						if(node.level == 0) {
							for(var i = 0; i < node.children.length; i++) {
								earth.Measure.SetWindSceneLayerVisible(parseInt(node.children[i].value), node.checked);
							}
						} else {
							earth.Measure.SetWindSceneLayerVisible(parseInt(node.value), node.checked);
						}
					}
				}
			}
		};
	}

	window.onbeforeunload = function() {
		analysis.clear();
		userdata.hideWindScene();
	};
})