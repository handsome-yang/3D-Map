/**
 * 作       者：StampGIS Team
 * 创建日期：2017年8月15日
 * 描       述：GPS监控的主要js文件
 * 遗留bug：
 * 修改日期：2017年11月7日
 **************************************************/
$.support.cors = true; //跨域支持
var internalTime = null; //循环timer
var earth = top.LayerManagement.earth; //三维球对象
var dynamicList = []; //所有运动对象集合
var dynamicListPeople = []; //人运动对象集合
var dynamicListCar = []; //车运动对象集合
var dynamicListBoat = []; //船运动对象集合
var dynamicListPlane = []; //飞机运动对象集合
var record; //包含所有路径点、路径以及对象
var trackPointsArr = [];
var tracks = []; //所有的路径集合
var objectLoaded = false; //是否都加载完毕
var lunXunTime = 5; //轮询时间
var pickDynamicObj = null; //查询拾取的运动对象
var finishTimes = 0;//运动对象完成时的点位次数

//初始化Ztree
function initTree() {
	var setting = {
		callback: {
			onClick: "",
			onDblClick: setMainTrack,
			onRightClick: rightClickTreeNode,
			beforeDrop: "",
			onDrop: "",
			onCollapse: "",
			onExpand: "",
			onNodeCreated: ""
		},
		check: {
			enable: false,
		}
	};
	var dynamicArr = getXmlData(); //获取数据
	if(dynamicArr == null || dynamicArr.length < 1) { //没有数据
		$("#btnStart").attr("disabled", "disabled");
	} else {
		$("#btnStart").removeAttr("disabled");
	}
	var dynamicData = [{
		id: 0,
		pId: 0,
		name: "监控对象",
		open: true,
		isParent: true,
		children: dynamicArr,
		icon: "../../images/treeIcons/folder.png"
	}]
	TreeObj = $.fn.zTree.init($("#dynamicTree"), setting, dynamicData);
}
//删除节点对象
function deleteNode(rootNode, nodeId, xmlData) {
	for(var i = 0; i < rootNode.childNodes.length; i++) {
		var childNode = rootNode.childNodes[i];
		if(childNode.getAttribute("ID") == nodeId) {
			rootNode.removeChild(childNode); //删除trackList节点
			var filePath = earth.Environment.RootPath + "GPSTrack\\track" + nodeId + ".xml";
			deleteFile(filePath); //删除该节点的xml
			if(xmlData) {
				saveXml("trackList", xmlData.xml);
			}
			break;
		}
	}

	for(var i = 0; i < record.length; i++) {
		if(record[i].ID == nodeId) {
			record.splice(i, 1);
			break;
		}
	}
}

//根据选中节点删除xml
function deleteData(node) {
	var xmlData = getXml("trackList");
	var rootNode = xmlData.documentElement;
	if(!node.isParent) {
		var nodeIndex = node.index;
		deleteNode(rootNode, node.id, xmlData);
	} else {
		var nodesLen = rootNode.childNodes.length;
		for(var i = 0; i < nodesLen; i++) {
			deleteNode(rootNode, rootNode.childNodes[i].id);
		}
		saveXml("trackList", xmlData.xml);

	}
}

//双击树节点,定位到当前位置
function setMainTrack(event, treeId, node) {
	if(node) {
		if(node.isParent) {
			return;
		} else {
			var nodeIndex = node.index;
			if(record[nodeIndex] && record[nodeIndex].track && record[nodeIndex].track.guid){
				earth.GPSTrackControl.SetMainTrack(record[nodeIndex].track.guid, 3);	
			}
		}
	}
}

//右键点击事件
function rightClickTreeNode(event, treeId, node) {
	if($("#btnStart").text() != "开始") {
		return;
	}
	//子节点弹出[编辑 删除]菜单
	$.fn.zTree.getZTreeObj(treeId).selectNode(node);
	if(node) {
		if(!node.isParent) {
			$('#contextMenu').menu('show', {
				left: event.pageX,
				top: event.pageY
			});
		}
	}
}

//通过trackPoint数组构造点集合
//trackPoint:通过解析xml得到的对象
//返回点集合pointArr
function getTrackPoints(trackPoint) {
	var thisRoute = trackPoint.Route;
	var pass = thisRoute.Pass;
	var pointArr = [];
	for(var i = 0; i < pass.length; i++) {
		var thisStation = pass[i];
		var stationPoint = {
			x: thisStation.Longitude,
			y: thisStation.Latitude,
			z: thisStation.Altitude,
			range: earth.Measure.MeasureTerrainAltitude(thisStation.Longitude, thisStation.Latitude) + parseFloat(thisStation.FlyHeight)
		};
		pointArr.push(stationPoint);
	}
	return pointArr;
}
//将gpstrack文件下面的解析为一个包含点集的数据集合并且返回
//主要用于构造ztree
function getXmlData() {
	var trackRecords = [];
	var trackXml = getXml("trackList");
	if(trackXml.xml) {
		record = $.xml2json(trackXml.xml);
		if(record && record.Record) {
			record = record.Record;
		} else {
			return null;
		}
		if(!record.length) { //只有一条记录
			record = [record];
		}
		var iconPath = "../../images/gpsTrack/";
		for(var i = 0; i < record.length; i++) {

			var thisRecord = { //构造ztree需要
				id: record[i].ID,
				name: record[i].NAME,
				isParent: false,
				index: i,
				icon: iconPath + record[i].TYPE + ".png"
			}
			trackRecords.push(thisRecord);
			var thisTrackFileName = "track" + record[i].ID;
			var trackPointXml = getXml(thisTrackFileName); //调用接口读取客户端中的xml
			if(trackPointXml.xml) {
				var trackPoint = $.xml2json(trackPointXml.xml);
				var trackPoints = getTrackPoints(trackPoint);
				record[i].trackPoints = trackPoints;
			}
		}
	}
	return trackRecords;
}

//获取运动对象列表
//callback：回调函数
function getDynamicList(callback) {
	earth.Event.OnDynamicListLoaded = function(list) { //获取到运动对象回调
		earth.Event.OnDynamicListLoaded = function() {}; //清除回调
		if(list == null || list.Count == 0) { //运动对象列表为空
			return;
		}
		dynamicList = [];
		dynamicListPeople = [];
		dynamicListCar = [];
		dynamicListBoat = [];
		dynamicListPlane = [];
		for(var i = 0; i < list.Count; i++) {
			var dynamic = list.Items(i);
			var type = dynamic.Type;
			if(type == "DynamicPeople") { //人
				dynamicListPeople.push(dynamic);
			} else if(type == "DynamicObject") { //车
				dynamicListCar.push(dynamic);
			} else if(type == "FlyObject" && dynamic.Name == "船") {
				dynamicListBoat.push(dynamic);
			} else if(type == "FlyObject" && dynamic.Name != "船") {
				dynamicListPlane.push(dynamic);
			}
			dynamicList.push(dynamic);

		}
		callback();
	};
	earth.DynamicSystem.ApplyDynamicList(); //获取运动对象列表
}

/**
 * 加载所有对象
 */
function loadAllObject() {
	var thisLoadId = null;
	//根据保存的XML里面的运动对象guid寻找是否有相同的对象
	for(var i = 0; i < record.length; i++) {
		record[i].trackPointIndex = 0; //设置运动物体目前跑到哪一个点位，用于定位
		var thisDynaId = record[i].DYNAMICID;
		for(var j = 0; j < dynamicList.length; j++) {
			if(dynamicList[j].guid == thisDynaId) {
				thisLoadId = thisDynaId;
				break;
			}
		}
		//如果有相同guid的对象则加载保存的对象
		if(thisLoadId) {
			earth.DynamicSystem.LoadDynamicObject(thisLoadId);
		} else { //如果没有,则根据保存的对象类型寻找加载对象
			if(record[i].TYPE == "car") {
				if(dynamicListCar && dynamicListCar.length > 0) {
					earth.DynamicSystem.LoadDynamicObject(dynamicListCar[0].guid);
				} else {
					earth.DynamicSystem.LoadDynamicObject(dynamicList[0].guid);
				}
			} else if(record[i].TYPE == "people") {
				if(dynamicListPeople && dynamicListPeople.length > 0) {
					earth.DynamicSystem.LoadDynamicObject(dynamicListPeople[0].guid);
				} else {
					earth.DynamicSystem.LoadDynamicObject(dynamicList[0].guid);
				}
			} else if(record[i].TYPE == "boat") {
				if(dynamicListBoat && dynamicListBoat.length > 0) {
					earth.DynamicSystem.LoadDynamicObject(dynamicListBoat[0].guid);
				} else {
					earth.DynamicSystem.LoadDynamicObject(dynamicList[0].guid);
				}
			} else if(record[i].TYPE == "plane") {
				if(dynamicListPlane && dynamicListPlane.length > 0) {
					earth.DynamicSystem.LoadDynamicObject(dynamicListPlane[0].guid);
				} else {
					earth.DynamicSystem.LoadDynamicObject(dynamicList[0].guid);
				}
			} else {
				//如果guid和类型都匹配不上,那么默认加载第一个运动对象
				earth.DynamicSystem.LoadDynamicObject(dynamicList[0].guid);
			}
		}
	}
}
/**
 * 开启循环
 * @param  {[string]} pointIndex [现在是第几个点]
 * @param  {[number]} i          [第几个对象]
 * @return {[type]}            [description]
 */
function roundTrack(pointIndex, i) {
	var nTrackIndex = 0;
	if(pointIndex % ((record[i].trackPoints.length - 1) * 2) <= record[i].trackPoints.length - 1) {
		nTrackIndex = pointIndex % ((record[i].trackPoints.length - 1) * 2);
	} else {
		nTrackIndex = ((record[i].trackPoints.length - 1) * 2) - pointIndex % ((record[i].trackPoints.length - 1) * 2);
	}
	record[i].trackPointIndex = nTrackIndex;
	record[i].track.AddGPS(record[i].trackPoints[nTrackIndex].x, record[i].trackPoints[nTrackIndex].y, record[i].trackPoints[nTrackIndex].range, lunXunTime * 1000);
}

/**
 * 没有开启循环的track
 * @param  {[string]} pointIndex [现在是第几个点]
 * @param  {[number]} i          [第几个对象]
 * @return {[type]}            [description]
 */
function normalTrack(pointIndex, i) {
	if(pointIndex < record[i].trackPoints.length) {
		record[i].trackPointIndex = pointIndex;
		record[i].track.AddGPS(record[i].trackPoints[pointIndex].x, record[i].trackPoints[pointIndex].y, record[i].trackPoints[pointIndex].range, lunXunTime * 1000);
	} else if(pointIndex > record[i].trackPoints.length){
		finishTimes++;
		if(record[i].track.BindObject) { //卸载运动对象
			earth.GlobeObserver.StopTracking();
			earth.GlobeObserver.Stop();
			record[i].track.Stop();
			earth.DynamicSystem.UnLoadDynamicObject(record[i].track.BindObject);
		}
		earth.GPSTrackControl.DeleteTrack(record[i].track.guid);
		record[i].track = null;
		if(finishTimes == record.length) { //当所有的都飞行完毕时将按钮状态还原
			clearInterval(internalTime);
			internalTime = null;
			$("#btnStart").text("开始");
			$("#btnAdd").removeAttr("disabled");
			$("#btnQuery").attr("disabled", "disabled");
			$("#round").removeAttr("disabled");
		}
	}
}

//开启所有的GPSTrack
function GPSTrack() {
	if(isNaN($("#time").val())) {
		alert("请输入正确的时间间隔");
		return;
	}
	lunXunTime = parseFloat($("#time").val());
	tracks = [];
	$("#round").attr("disabled", true);
	$("#showRoute").attr("disabled", true);
	$("#showName").attr("disabled", true);
	getDynamicList(function() { //获取运动对象列表
		var dIndex = 0;
		earth.Event.OnDocumentChanged = function(type, newGuid) {
			gpsPlay(record[dIndex], newGuid); //设置路径属性，加载路径
			dIndex++;
			if(dIndex == record.length) { //所有运动对象加载完毕
				$("#showRoute").attr("disabled", false);
				$("#showName").attr("disabled", false);
				objectLoaded = true;
			}
		};
		loadAllObject(); //加载对象
		var pointIndex = 3;
		var isRound = $("#round").is(":checked"); //循环是否开启
		finishTimes = 0; //路径完成的条数,针对不开启循环
		internalTime = setInterval(function() {
			if(internalTime == null) { //防止报错
				return;
			}
			///如果是接入实时数据（url），需要通过AJAX实时请求URL服务，返回坐标点加入到AddGPS中
			for(var i = 0; i < record.length; i++) {
				if(record[i].track && record[i].trackPoints) {
					if(isRound) { //如果开启了循环则用定时器实现来回
						roundTrack(pointIndex, i);
					} else { //如果没有开启循环,则在加载完一条Track的时候就将此track设为null
						normalTrack(pointIndex, i);
					}
				}
			}
			pointIndex++;
		}, lunXunTime * 1000);
	});
}
//停止所有GPS
function GPSStop() {
	$("#round").attr("disabled", false);
	if(internalTime) { //清除掉定时器
		clearInterval(internalTime);
		internalTime = null;
	}
	//此接口使用有问题，暂时注释掉
	for(var i = 0; i < record.length; i++){
		if(!record[i].track){
			continue;
		}
	    earth.GPSTrackControl.SetMainTrack(record[i].track.guid, 4);
	}
	if(earth && earth.GPSTrackControl && earth.GlobeObserver) {
		earth.GlobeObserver.StopTracking();
		earth.GlobeObserver.Stop();
		for(var i = record.length - 1; i >= 0; i--) {
			if(record[i].track) {
				record[i].track.Stop();
				earth.DynamicSystem.UnLoadDynamicObject(record[i].track.BindObject); //写在运动物体
				earth.GPSTrackControl.DeleteTrack(record[i].track.guid); //删除三维球上的路径
				record[i].track = null;
			}
		}
	}

	tracks = [];
}
//根据保存的xml来对track进行设置
function gpsPlay(trackObj, newGuid) {
	var pts = trackObj.trackPoints;
	var track = null;
	var tid = earth.Factory.CreateGuid();
	track = earth.Factory.CreateGPSTrack(tid, trackObj.NAME);
	track.DataType = 3; //1-从串口获取数据，2-从文件获取数据，3-使用接口AddGPS手动传入数据
	var isShowRoute = $("#showRoute").is(":checked");
	track.Visibility = isShowRoute;
	track.ShowBindObject(true);

	track.InitFollowTrack(180, 15, 2, 10);
	track.HeightType = trackObj.HEIGHTTYPE; //1贴地,0读取数据
	track.BindObject = newGuid;
	track.NameColor = 0xffffffff;
	track.InformationColor = 0xffffffff;
	track.Play();
	tracks.push(track);
	var pointIndex = 0;
	var time = lunXunTime * 1000;
	//如果是读取数据高程则读取xml里面的range
	track.AddGPS(pts[pointIndex].x, pts[pointIndex].y, pts[pointIndex].range, time);
	pointIndex++;
	track.AddGPS(pts[pointIndex].x, pts[pointIndex].y, pts[pointIndex].range, time);
	pointIndex++;
	track.AddGPS(pts[pointIndex].x, pts[pointIndex].y, pts[pointIndex].range, time);
	pointIndex++;
	track.Information = trackObj.INFORMATION;
	var isShowName = $("#showName").is(":checked");
	track.ShowInfomation = false;
	track.ShowName = isShowName;
	trackObj.track = track;
}

//验证表单需要填写的是否符合要求
function check() {
	var objName = $("#objName").val();
	if(objName == "") {
		alert("请输入对象名称");
		return false;
	}
	var trackFile = $("#trackFile").val();
	if(!trackFile) {
		alert("请选择运动轨迹xml文件");
		return false;
	}
	var detailInfo = $("#detailInfo").val();
	if(detailInfo == "") {
		alert("请输入对象属性信息");
		return false;
	}
	return true;
}
//保存xml文件
function saveXml(fileName, xmlStr) {
	var gpsTrckFile = earth.Environment.RootPath + "GPSTrack\\" + fileName;
	earth.UserDocument.SaveXmlFile(gpsTrckFile, xmlStr);
}
//获取xml文件的内容
function getXml(fileName) {
	var gpsTrckFile = earth.Environment.RootPath + "GPSTrack\\" + fileName + ".xml";
	var fileXml = earth.UserDocument.LoadXmlFile(gpsTrckFile);
	var fileDoc = loadXMLStr(fileXml);
	if((fileDoc === null) || (fileDoc.xml === "")) {
		var filePath = earth.Environment.RootPath + "GPSTrack";
		earth.UserDocument.CreateDirectory(filePath);
		var xmlStr = '<xml></xml>';
		saveXml(fileName, xmlStr);
		fileDoc = loadXMLStr(xmlStr);
	}
	return fileDoc;
}

//删除一整个xml文件
function deleteFile(filePath) {
	earth.UserDocument.DeleteXmlFile(filePath);
}

$(function() {
	var divHeight = $(parent.document).height() - 480;
	$("#dgDiv").height(divHeight);
	$("#dgDiv").mCustomScrollbar();
	//初始化监控对象zTree
	initTree();
	//初始化运动对象select框
	getDynamicList(function() {
		var str;
		for(var i = 0; i < dynamicList.length; i++) {
			str += "<option value='" + dynamicList[i].guid + "' dynamicType='" + dynamicList[i].Type + "'>";
			str += dynamicList[i].name + "</option>";
		}
		$(str).appendTo("#dynamicObj");
	});

	//开始按钮点击事件
	$("#btnStart").click(function() {
		if($("#btnStart").text() == "开始") {
			GPSTrack();
			$("#btnStart").text("停止");
			$("#btnQuery").removeAttr("disabled");
			$("#btnAdd").attr("disabled", true);
		} else {
			GPSStop();
			$("#btnStart").text("开始");
			$("#btnQuery").attr("disabled", "disabled");
			$("#btnAdd").attr("disabled", false);
		}
	});

	//显示路径checkbox点击事件
	$("#showRoute").click(function() {
		var isCheck = $("#showRoute").is(":checked");
		for(var i in record) {
			var track = record[i].track;
			if(track) {
				track.Visibility = isCheck;
			}
		}
	});

	//显示名称checkbox点击事件
	$("#showName").click(function() {
		var isCheck = $("#showName").is(":checked");
		for(var i in record) {
			var track = record[i].track;
			if(track) {
				track.ShowName = isCheck;
			}
		}
	});

	//查询事件
	$("#btnQuery").click(function() {
		enablePick(true);
	});

	//查询方法
	function enablePick(flag) {
		if(pickDynamicObj) {
			pickDynamicObj.Selected = false;
			pickDynamicObj.ShowInfomation = false;
		}
		if(flag) {
			earth.Environment.SetCursorStyle(32512);
			earth.Event.OnLBDown = _onlbd;
			earth.Event.OnRBDown = _onrbd;
		} else {
			earth.Event.OnLBDown = function() {};
		}
	}

	//左键点击拾取方法
	function _onlbd(pt2) {
		var t = earth.GPSTrackControl.PickTrack(pt2.x, pt2.y);
		if(t != null) {
			if(pickDynamicObj) {
				pickDynamicObj.Selected = false;
				pickDynamicObj.ShowInfomation = false;
			}
			pickDynamicObj = t;
			t.Selected = true;
			t.ShowInfomation = true;
		}
		setTimeout(function() {
			earth.Event.OnLBDown = _onlbd;
		}, 30);
	}

	//右键取消查询方法
	function _onrbd() {
		if(pickDynamicObj) {
			pickDynamicObj.Selected = false;
			pickDynamicObj.ShowInfomation = false;
			pickDynamicObj = null;
		}

		earth.Event.OnLBDown = function() {};
		earth.Environment.SetCursorStyle(209);
	}

	//页面关闭卸载事件
	window.onunload = function() {
		GPSStop();
	}
	//选取xml文件
	$("#selectFile").click(function() {
		var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "xml文件(*.xml)|*.xml");
		if(filePath == "") {
			return;
		}
		$("#trackFile").attr("value", filePath);
	});
	//右键删除事件
	$("#divDeleteTrack").click(function() {
		var zTree = $.fn.zTree.getZTreeObj("dynamicTree");
		var nodes = zTree.getSelectedNodes();
		var node = nodes[0];
		if(node && node.id) {
			if(confirm("是否确定要删除？")) {
				//树上移除相关节点(如果有子节点也一并移除)
				zTree.removeNode(node);
				//同步数据到本地xml文件
				deleteData(node);
				var rootNode = zTree.getNodes()[0];
				if(rootNode.children == null || rootNode.children.length == 0) {
					$("#btnStart").attr("disabled", "disabled");
				}
			}
		};
	})
	//新建点击事件,将xml转化为GPSTrack所需的模式
	$("#btnAdd").click(function() {
		var objName = $("#objName").val();
		if(objName == "") {
			alert("请输入对象名称");
			return false;
		}
		var trackFile = $("#trackFile").val();
		if(!trackFile) {
			alert("请选择运动轨迹xml文件");
			return false;
		}
		var detailInfo = $("#detailInfo").val();
		if(detailInfo == "") {
			alert("请输入对象属性信息");
			return false;
		}
		//加载xml文档
		var xmlTrackData = earth.UserDocument.LoadXmlFile(trackFile);
		var xmlDoc = loadXMLStr(xmlTrackData);
		//遍历节点
		if(xmlDoc.getElementsByTagName("Route")) {
			var Route = xmlDoc.getElementsByTagName("Route")[0].xml;
			if(!Route) {
				alert("数据不合规范,请重新选择");
				return;
			}
			Route = $.xml2json(Route);
			var routeGuid = earth.Factory.CreateGuid();
			if(!Route) {
				alert("数据不合规范,请重新选择");
				return;
			}
			var pass = Route.Pass;
			if(!pass || !pass.length) {
				alert("数据不合规范,请重新选择");
				return;
			}
			var routeXml = "<xml><Route id='" + routeGuid + "'>"
			for(var i = 0; i < pass.length; i++) {
				routeXml += "<Pass Longitude='" + pass[i].Longitude + "'";
				routeXml += " Latitude='" + pass[i].Latitude + "'";
				routeXml += " Altitude='" + pass[i].Altitude + "'";
				routeXml += " FlyHeight='" + pass[i].FlyHeight + "'>";
				routeXml += "</Pass>";
			}
			routeXml += "</Route></xml>";
		} else {
			alert("数据不合规范,请重新选择");
			return;
		}
		var trackXml = getXml("trackList");
		var dynamicId = $("#dynamicObj").val();
		var heightType = $("#heightType").val();
		var dynamicType = $("#dynamicObj option:selected").attr("dynamicType");
		var dynamicName = $("#dynamicObj option:selected").text();
		if(dynamicType == "DynamicPeople") {
			var type = "people";
		} else if(dynamicType == "DynamicObject") {
			var type = "car";
		} else if(dynamicType == "FlyObject" && dynamicName == "船") {
			var type = "boat";
		} else if(dynamicType == "FlyObject" && dynamicName != "船" && dynamicName != "摄像机") {
			var type = "plane";
		} else {
			var type = "camera";
		}
		var attrArr = [{
				name: "ID",
				value: routeGuid
			},
			{
				name: "NAME",
				value: objName
			},
			{
				name: "DYNAMICID",
				value: dynamicId
			},
			{
				name: "TYPE",
				value: type
			},
			{
				name: "HEIGHTTYPE",
				value: heightType
			},
			{
				name: "INFORMATION",
				value: detailInfo
			}
		]
		var recordNode = createElementNode("Record", attrArr, trackXml);
		trackXml.documentElement.appendChild(recordNode); //增加xml节点
		saveXml("trackList", trackXml.xml); //保存总的xml文件
		var thisTrackName = "track" + routeGuid;
		saveXml(thisTrackName, routeXml); //保存单个路径的xml
		initTree(); //重新加载ztree
	})
});