/**
 * 作    者：StampGIS Team
 * 创建日期：2017年 11月 14日
 * 描    述：视频监控相关功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 20日
 ******************************************/

var earth = parent.earth;
var layer; //摄像机图层
var cameras = []; //所有摄像机对象
var cameraOpenedId = []; //已打开的相机的id
var curSelNodeId = null; //当前选中节点id
var cameraTreeData; //树目录数组
var num = 0; //摄像机编号
var isAfterInit = false; //是否点击链接
var treeObj = null;
var existingCamera = { //当前打开的摄像机信息
	cNum: null,
	cDeviceID: null,
	cCamera: null
};
var node2Guid; //节点对应的模型GUID
var deviceID2Guid = {};
var toContraolCamera;
var cameraDictionary = {};

//初始化
$(function() {
	$("#divTreeParent").mCustomScrollbar(); //设滚动条样式
	setDivHeight(); //设置布局

	layer = earth.Factory.CreateEditLayer(earth.Factory.CreateGuid(), "mylayer", earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 10, '');
	earth.AttachObject(layer);

	//事件委托click
	$("#paramSetInner").on("click", ".normalBtn", function(e) {
		var thisId = this.id;
		switch(thisId) {
			case "btnLinkOrBroke": //点击链接事件
				if($(this).text() == "链接") {
					isAfterInit = false;

					//初始化设备列表,获取设备
					initDeviceList(function(){
						if(cameraTreeData && cameraTreeData.length > 2) {
							$("#btnLinkOrBroke").text("断开");
						}
					}); 
				} else if($(this).text() == "断开") { //点击断开事件
					btnBrokedUp();
					$(this).text("链接");
				}
				break;
			case "btnSetting": //点击链路设置事件
				btnSetting();
				break;
			case "btnImport":
				earth.paramIp = top.params.IP;
				var returnValue = window.showModalDialog("gb28181Import.html", earth, "status:no;title:no;help:no;resizable:no;scroll:no;location:no;toolbar:no;dialogWidth=380px;dialogHeight=170px;");
				if(returnValue){
					alert("导入成功！");
				}
				break;
			default:
				break;
		}
	});

	//参数控制，确认事件
	$("#btnConfirm").click(function() {
		if(!cameras[curSelNodeId]){
			alert("请选择摄像机节点");
			return;
		}
		var toContraolCamera = cameras[curSelNodeId];
		var horizonRotate = parseFloat($("#horizonRotate").val()); //水平转动
		var verRotate = parseFloat($("#verRotate").val()); //垂直转动
		var leftRightSpeed = parseFloat($("#leftRightSpeed").val()); //左右旋转速度
		var updownSpeed = parseFloat($("#updownSpeed").val()); //上下旋转速度
		if(isNaN(horizonRotate) || isNaN(leftRightSpeed) || isNaN(verRotate) || isNaN(updownSpeed)){
			alert("输入格式错误！");
			return;
		}
		//下面判断是否超过了最左或最右
		var cameraRotationAngle = parseFloat(cameraDictionary[curSelNodeId].cameraRotationAngle);
		if(cameraRotationAngle >= top.params.camearaMaxRotation && horizonRotate > 0){
			alert("已经向右旋转至最大角度，请向左旋转！");
			return;
		}else if(cameraRotationAngle <= 0 && horizonRotate < 0){
			alert("已经向左旋转至最小角度，请向右旋转！");
			return;
		}

		//下面判断是否超过了最上或最下
		var currentCameraTilt = parseFloat(cameraDictionary[curSelNodeId].cameraTiltAngle);
		if(currentCameraTilt >= top.params.camearaMaxTilt && verRotate > 0){
			alert("已经向上旋转至最大角度，请向下旋转！");
			return;
		}else if(currentCameraTilt <= 0 && verRotate < 0){
			alert("已经向下旋转至最小角度，请向上旋转！");
			return;
		}

		//下面判断是否超过了最左或最右
		cameraRotationAngle += horizonRotate;
		if(cameraRotationAngle >= top.params.camearaMaxRotation){//旋转至最右侧(350度)，停止旋转
			horizonRotate = top.params.camearaMaxRotation - cameraDictionary[curSelNodeId].cameraRotationAngle;
			cameraDictionary[curSelNodeId].cameraRotationAngle = top.params.camearaMaxRotation;
		}else if(cameraRotationAngle <= 0){//旋转至最左侧(0度)，停止旋转
			horizonRotate = 0 - cameraDictionary[curSelNodeId].cameraRotationAngle;
			cameraDictionary[curSelNodeId].cameraRotationAngle = 0;
		}else{
			cameraDictionary[curSelNodeId].cameraRotationAngle = cameraRotationAngle;
		}

		//下面判断是否超过了最上或最下
		currentCameraTilt += verRotate;
		if(currentCameraTilt >= top.params.camearaMaxTilt){//旋转至最上方侧(90度)，停止旋转
			verRotate = top.params.camearaMaxTilt - cameraDictionary[curSelNodeId].cameraTiltAngle;
			cameraDictionary[curSelNodeId].cameraTiltAngle = top.params.camearaMaxTilt;
		}else if(currentCameraTilt <= 0){//旋转至最下方(0度)，停止旋转
			verRotate = 0 - cameraDictionary[curSelNodeId].cameraTiltAngle;
			cameraDictionary[curSelNodeId].cameraTiltAngle = 0;
		}else{
			cameraDictionary[curSelNodeId].cameraTiltAngle = currentCameraTilt;
		}

		var pControlType; //左右方位：2是左，3是右
		var pControlType2; //上下方位：0是上，1是下

		//+右 -左
		if(horizonRotate > 0) {
			pControlType = 3;//向右
		}
		if(horizonRotate < 0) {
			pControlType = 2;//向左
		}

		//-下  +上
		if(verRotate > 0) {
			pControlType2 = 0;//向上
		}
		if(verRotate < 0) {
			pControlType2 = 1;//向下
		}

		var hTime = horizonRotate / leftRightSpeed; //水平转动时间
		var vTime = verRotate / updownSpeed; //垂直转动时间
		hTime = Math.abs(hTime);
		vTime = Math.abs(vTime);
		//上下旋转
		toContraolCamera.camera.GB28181CameraPtzControl(pControlType2, 0, 255);
		//上下抬头
		camera_Updown(toContraolCamera.bindElement, toContraolCamera.camera, verRotate, vTime, 0);
		setTimeout(function() {
			//停止
			toContraolCamera.camera.GB28181CameraPtzControl(6, 0, 255);

			//停止之后再进行左右旋转
			toContraolCamera.camera.GB28181CameraPtzControl(pControlType, 0, 255);
			//左右旋转
			camera_Leftright(toContraolCamera.bindElement, toContraolCamera.camera, horizonRotate, hTime, 0);
			setTimeout(function() {
				toContraolCamera.camera.GB28181CameraPtzControl(6, 0, 255);

				var currentCameraData = cameraDictionary[curSelNodeId];

				//更新树节点
				updateTreeNode(curSelNodeId, currentCameraData);

				
				//调用接口保存角度信息数据
				var result = earth.Gb28181CameraManager.SetCameraAngleAndPosition(curSelNodeId, 
							parseFloat(currentCameraData.cameraTiltAngle), 
							parseFloat(currentCameraData.cameraHeadingAngle), 
							parseFloat(currentCameraData.cameraRotationAngle), 
							parseFloat(currentCameraData.cameraLongitude), 
							parseFloat(currentCameraData.cameraLatitude), 
							currentCameraData.cameraDeviceType);
				var jsonResult = $.xml2json(result);
				if(jsonResult != "SetCameraInfo succeed"){//保存调整后的数据到数据库中
					alert("保存数据库失败！");
				}

			}, hTime * 1000);//设置定时器-固定旋转对长时间后停止-水平
		}, vTime * 1000);//设置定时器-固定旋转对长时间后停止-抬头
	});

	/**
	 * 设置修改的俯仰角和旋转角
	 * @param {[type]} souNode [description]
	 * @param {[type]} desNode [description]
	 */
	function setUpdateParam(souNode, desNode){
		desNode.cameraTiltAngle = souNode.cameraTiltAngle;
		desNode.cameraRotationAngle = souNode.cameraRotationAngle;
	}

	/**
	 * 更新当前节点
	 * @param  {[type]} nodeId            [description]
	 * @param  {[type]} currentCameraData [description]
	 * @return {[type]}                   [description]
	 */
	function updateTreeNode(nodeId, currentCameraData){
		var tempNodes = treeObj.getNodesByParam("id", nodeId, null);
		if(tempNodes.length > 0) {
			for(var i = 0; i < tempNodes.length; i++){
				setUpdateParam(currentCameraData, tempNodes[i]);
				treeObj.updateNode(tempNodes[i]);
			}
		}
		for(var i = 0; i < cameraTreeData.length; i++){
			if(cameraTreeData[i].id == nodeId){
				setUpdateParam(currentCameraData, cameraTreeData[i]);
			}
		}
	}

	var events = {
		"keyup": function(event) {
			var thisObj = this;
			var id = this.id;
			if(id == "horizonRotate") { //左右旋转
				checkNum(thisObj, false, 2, top.params.camearaMaxRotation);
			} else if(id == "verRotate"){
				checkNum(thisObj, false, 2, top.params.camearaMaxTilt);
			}else if(id == "leftRightSpeed") {
				checkNum(thisObj, true, 2, top.params.camearaMaxRotation);
			}else if(id == "updownSpeed") {
				checkNum(thisObj, true, 2, top.params.camearaMaxTilt);
			}

			if(($("#horizonRotate").val() != 0 && $("#leftRightSpeed").val() != 0) || ($("#verRotate").val() != 0 && $("#updownSpeed").val() != 0)) { //修改文本框后就启用确定按钮
				$("#btnConfirm").removeAttr("disabled");
			}
		},
		"blur": function() {
			if(!this.value) {
				this.value = 0;
			}
			if(($("#horizonRotate").val() == 0 || $("#leftRightSpeed").val() == 0) && ($("#verRotate").val() == 0 || $("#updownSpeed").val() == 0)) { //输入内容为空时就禁用确定按钮
				$("#btnConfirm").attr("disabled", "true");
			}
		}
	};

	/**
	 * 事件委托
	 */
	$(document).on(events, ".param>input[type='text']");
});

/**
 * 对象深拷贝函数
 * @param {Object} source 对象
 */
function objDeepCopy(source) {
	var sourceCopy = source instanceof Array ? [] : {};
	for(var item in source) {
		sourceCopy[item] = typeof source[item] === 'object' ? objDeepCopy(source[item]) : source[item];
	}
	return sourceCopy;
}

/**
 * 点击链路设置事件
 */
function btnSetting() {
	if(cameraTreeData && cameraTreeData.length == 0) {
		return;
	}
	var locLeft = window.screenLeft + earth.offsetLeft + 92;
	var locTop = window.screenTop;
	var windowInfo = "dialogHeight = 540px; dialogWidth = 540px;dialogLeft = " + locLeft + ";dialogTop=" + locTop + ";scroll=no";
	var cameraData = objDeepCopy(cameraTreeData); //复制一个，执行深拷贝
	var resultValue = window.showModalDialog("../../html/view/linkSetting.html", [cameraData, cameraOpenedId, earth, treeObj, cameraTreeData], windowInfo);
	if(!resultValue || resultValue.selectedList.length == 0) {
		return;
	}

	closeCameras();
	var sList = resultValue.selectedList; //所选择的list
	//先重新初始化，判断所选节点是否还在树目录中，
	isAfterInit = true;
	initDeviceList(callFunc); //重新初始化
	function callFunc() {
		var msg = "";
		var showIndex = 0;
		for(var i = 0, len = parseInt(resultValue.selectedLinkNum); i < len; i++) {
			if(sList[i]) {
				//先判断该节点是否在树目录中，再就执行，不在就创建空的并提示
				var beTrue = beforeOpenNewCamera(sList[i].cameraDeviceID);
				if(beTrue) {
					showIndex++;
					existingCamera = createCamera(sList[i].cameraLongitude, sList[i].cameraLatitude, sList[i].cameraDeviceID, i, sList[i].cameraTiltAngle, sList[i].cameraHeadingAngle, sList[i].cameraRotationAngle);
					var alt = earth.Measure.MeasureTerrainAltitude(sList[i].cameraLongitude, sList[i].cameraLatitude);
					earth.GlobeObserver.FlytoLookat(sList[i].cameraLongitude, sList[i].cameraLatitude, alt, 0, 90, 0, 100, 3);	
				} else { //不存在创建空的，并记下id用于提示
					var cDate = new Date();
					existingCamera = createCamera(0, 0, cDate.getTime(), i, 0, 0, 0);
					(sList[i].cameraDeviceID.length > 10) && (msg += sList[i].cameraDeviceID + "，");
				}
			} else { //不够的创建空的
				var cDate = new Date();
				existingCamera = createCamera(0, 0, cDate.getTime(), i, 0, 0, 0);
			}
		}
		if(!treeObj) {
			closeCameras();
		}
		resetEarthToolHeight();
		if(msg) {
			alert("设备：" + msg + "已离线！");
		}
	}
}

/**
 * 页面卸载事件
 * @param  {[type]} event [description]
 * @return {[type]}       [description]
 */
window.onbeforeunload = function(event) {
	closeCameras();
	earth.DetachObject(layer);
	top.resizeEarthTool();
}

/**
 * 断开链接执行函数
 */
function btnBrokedUp() {
	closeCameras();
	cameraTreeData = null;
	cameraData = null;
	cameraDictionary = {};
	$("#sipRootTree").empty();
	$("#btnSetting").attr("disabled", "disabled");
	$("#btnConfirm").attr("disabled", "disabled");
	top.resizeEarthTool();
}

/**
 * 初始化设备列表
 */
function initDeviceList(callFuc) {
	//初始化时直接获取所有设备
	var gb28181 = earth.Gb28181CameraManager;
	gb28181.Gb28181Server = top.params.ip;
	earth.Event.OnGb28181GetCameraInfo = function(result) {
		if(result) {
			var cameraListXml = result.CameraDeviceXml;
			try {
				cameraTreeData = getCameraList(cameraListXml);
				if(cameraTreeData && cameraTreeData.length > 2) {
					$("#btnSetting").removeAttr("disabled");
				} else {
					$("#sipRootTree").empty();
					$("#btnSetting").attr("disabled", "disabled");
					if(!isAfterInit) {
						alert("未搜索到设备，请检查设备链接状态后重试！");
					}
				}
				if(callFuc && typeof(callFuc) == "function") {
					callFuc();
				}
			} catch(e) {

			}
		}
	}
	gb28181.Query_GB28181DeviceInfo(); //请求设备信息
}

/**
 * 获取摄像机设备列表
 */
function getCameraList(cameraListXml) {
	cameraDictionary = {};
	treeObj = null;
	var setting = {
		data: {
			simpleData: {
				enable: true,
				idKey: "id",
				pIdKey: "pId",
				rootPId: null
			}
		},
		view: {
			fontCss: getFont,
			dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
			expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
			selectedMulti: false //设置是否允许同时选中多个节点
		},
		callback: {
			onDblClick: onDblClick,
			onClick: onClick
		}
	};
	var jsonData = $.xml2json(cameraListXml);
	var resultnum = jsonData.SumNum;
	var treeData = [{
		id: -1,
		pId: -1,
		name: "Camera",
		open: true,
		isParent: true
	}];
	if(0 < resultnum) {
		var cParentId = null;
		var tempCameraName;
		var resultOut = "";
		for(i = 0; i < resultnum; i++) {
			var objItem = jsonData.DeviceList.Item[i];
			var cameraDeviceID = objItem.DeviceID; //当前设备id
			var cameraName = objItem.Name; //当前设备名
			var cameraStatus = objItem.Status; //状态，ok为在线
			var cameraModel = objItem.Model;

			if(!cameraDeviceID || cameraDictionary[cameraDeviceID]) {
				continue;
			}

			//调用接口获取数据库相关字段
			earth.Gb28181CameraManager.Gb28181Server = top.params.ip;
			resultOut = earth.Gb28181CameraManager.GetCameraAngleAndPosition(cameraDeviceID);

			if(resultOut.indexOf("failed") == -1) { //存在这个就是失败
				var jsonData2 = $.xml2json(resultOut); //
				var cameraDeviceType = jsonData2.DeviceType; //设备类型
				var cameraTiltAngle = jsonData2.DepressionAngle; //俯仰角
				var cameraHeadingAngle = jsonData2.ElevationAngle; //方位角-未用到
				var cameraRotationAngle = jsonData2.RotationAngle; //旋转角
				var cameraLongitude = jsonData2.Longitude;
				var cameraLatitude = jsonData2.Latitude;
			}

			if(!top.params.isSimulationCamera) { //不启用模拟摄像头则开启过滤
				if(cameraModel.indexOf("IP") == -1) continue; //过滤非IP camera
				tempCameraName = cameraName;
			} else {
				tempCameraName = cameraDeviceID;
			}

			//在线状态判断
			if(cameraStatus != "OK" && cameraStatus != "ON") {
				var font = {
					"color": "grey"
				};
				//根据摄像机类型决定图标样式  枪机或者球机
				if(cameraDeviceType == 0) {//0表示球机
					var icon = "../../images/GB28181/球机摄像头grey.png";
				} else {//1表示枪机
					var icon = "../../images/GB28181/枪机摄像头grey.png";
				}
			}else{
				var font = { //字体颜色，根据状态决定
					"color": "limegreen"
				};
				//根据摄像机类型决定图标样式  枪机或者球机
				if(cameraDeviceType == 0) {//0表示球机
					var icon = "../../images/GB28181/球机摄像头blue.png";
				} else {//1表示枪机
					var icon = "../../images/GB28181/枪机摄像头blue.png";
				}
			}

			var tempId = cameraDeviceID.substring(0, 10); //当前设备的编号的前10位
			if(tempId != cParentId) {
				cParentId = tempId;
				//增加新的父节点
				treeData.push({
					id: cParentId,
					pId: -1,
					name: cParentId,
					open: true,
					isParent: true
				});
			}

			//初始化链接的摄像头存入数据字典中，方便下次使用
			cameraDictionary[cameraDeviceID] = {
				id: cameraDeviceID,
				pId: cParentId,
				name: tempCameraName,
				font: font,
				icon: icon,
				isParent: false,
				cameraDeviceID: cameraDeviceID,
				cameraLongitude: cameraLongitude,
				cameraLatitude: cameraLatitude,
				cameraModel: cameraModel,
				cameraStatus: cameraStatus,
				cameraDeviceType: cameraDeviceType,
				cameraTiltAngle: cameraTiltAngle,
				cameraHeadingAngle: cameraHeadingAngle,//未用到
				cameraRotationAngle: cameraRotationAngle
			};
			treeData.push(cameraDictionary[cameraDeviceID]);
		}
		treeObj = $.fn.zTree.init($("#sipRootTree"), setting, treeData);
	};
	return treeData;
}

/**
 * 设置树节点字体颜色
 * @param {Object} treeId 树id
 * @param {Object} node 节点
 */
function getFont(treeId, node) {
	return node.font ? node.font : {};
}

var timeCount = 100;
/**
 * 摄像头俯仰
 * @param  {[type]} elementCone  [description]
 * @param  {[type]} attachSphere [description]
 * @param  {[type]} tilt         [description]
 * @param  {[type]} time         [description]
 * @param  {[type]} timeIndex    [description]
 * @return {[type]}              [description]
 */
function camera_Updown(elementCone, attachSphere, tilt, time, timeIndex){
	if(timeIndex >= timeCount){
		return;
	}
	var rot_offset = attachSphere.RotOffset;
	rot_offset.Y -= parseFloat(tilt)/timeCount;
	attachSphere.RotOffset = rot_offset;
	elementCone.UpdateBindObject();
	timeIndex++;
	setTimeout(function(){
		camera_Updown(elementCone, attachSphere, tilt, time, timeIndex);
	}, (parseFloat(time)/timeCount) * 1000);
}

/**
 * 摄像头旋转
 * @param  {[type]} elementCone  [description]
 * @param  {[type]} attachSphere [description]
 * @param  {[type]} rotation     [description]
 * @return {[type]}              [description]
 */
function camera_Leftright(elementCone, attachSphere, rotation, time, timeIndex){
	if(timeIndex >= timeCount){
		return;
	}
	var rot_offset = attachSphere.RotOffset;
	rot_offset.Z -= parseFloat(rotation)/timeCount;
	attachSphere.RotOffset = rot_offset;
	elementCone.UpdateBindObject();
	timeIndex++;
	setTimeout(function(){
		camera_Leftright(elementCone, attachSphere, rotation, time, timeIndex);
	}, (parseFloat(time)/timeCount) * 1000);
}


/**
 * 创建摄像机
 * @param {Object} lon 经度
 * @param {Object} lat 纬度
 * @param {Object} deviceID  摄像机编号
 * @param {Object} num 窗口编号
 */
function createCamera(lon, lat, deviceID, num, tilt, heading, rotation) {
	var elementGuid = earth.Factory.CreateGuid();
	deviceID2Guid[deviceID] = elementGuid; //存储映射关系

	//创建一个隐藏的Element对象，摄像头绑定到该Element对象上
	var elementCone = earth.Factory.CreateElementCone(earth.Factory.CreateGuid(), "testCone");
	elementCone.BeginUpdate();	
	var altitude = earth.Measure.MeasureTerrainAltitude(lon, lat) + top.params.cameraDefaultHeight; //默认离地高度10米
	elementCone.SphericalTransform.SetLocationEx(lon, lat, altitude);
	elementCone.SphericalTransform.SetRotationEx( 90, top.params.cameraDefaultHeading, 0 );
	elementCone.BottomRadius = 1;
	elementCone.TopRadius = 0;
	elementCone.Height = 0.1;
	elementCone.Underground = true;
	elementCone.EndUpdate();
	layer.BeginUpdate();
	layer.AttachObject(elementCone);
	layer.EndUpdate();
	elementCone.Visibility = false;

	var rot_offset = earth.Factory.CreateVector3();
	rot_offset.X = 0;
	rot_offset.Y = - parseFloat(tilt);
	rot_offset.Z = - parseFloat(rotation);

	var camera = earth.factory.CreateElementCamera(elementGuid, deviceID, 1, num);
	camera.SetGB28181PlayDeviceID(deviceID);
	camera.SetGB28181ServerUrl(top.params.ip);
	camera.EnableCameraShot = false; //反投影开关
	camera.Fov = 45;
	camera.EnableMediaStream = true;
	camera.SphericalTransform.SetLocationEx(lon, lat, altitude);//把摄像机对象当做普通对象
	camera.RotOffset = rot_offset;//设置绑定到对象上的offset
	camera.Underground = true;

	layer.BeginUpdate();
	layer.AttachObject(camera);
	layer.EndUpdate();
	elementCone.AttachObject(camera);

	cameras[deviceID] = {
		camera: camera,
		bindElement: elementCone
	};

	cameraOpenedId.push({
		num: num,
		cameraLongitude: lon,
		cameraLatitude: lat,
		cameraDeviceID: deviceID,
		cameraTiltAngle: tilt,
		cameraHeadingAngle: heading,
		cameraRotationAngle: rotation
	});
	return {
		cNum: num,
		cDeviceID: deviceID,
		cCamera: camera,
		cBindElement: elementCone
	};
}

/**
 * 打开新摄像机前先处理
 * @param {Object} newCameraId  摄像机id
 */
function beforeOpenNewCamera(newCameraId) {
	//在新的树中查找点击的node
	if(treeObj && typeof(treeObj.getNodeByParam) == "function") {
		var bTrue = treeObj.getNodeByParam("id", newCameraId, null); //当前节点是否存在新树的节点中
	} else {
		var bTrue = false;
	}
	if(!bTrue) { //不存在
		if(cameras[curSelNodeId]) {
			cameras[curSelNodeId].camera.EnableMediaStream = false;
			layer.DetachWithDeleteObject(cameras[curSelNodeId].camera);
			layer.DetachWithDeleteObject(cameras[curSelNodeId].bindElement);
		}
		return false;
	} else {
		return true;
	}
}

/**
 * 双击事件
 * @param  {[type]} event  [事件]
 * @param  {[type]} treeId [树节点ID]
 * @param  {[type]} node   [树节点Node]
 * @return {[type]}        [无]
 */
var onDblClick = function(event, treeId, node) {
	if(node) {
		if(node.isParent) return;
		curSelNodeId = node.id;
		var alt = earth.Measure.MeasureTerrainAltitude(node.cameraLongitude, node.cameraLatitude);
		earth.GlobeObserver.FlytoLookat(node.cameraLongitude, node.cameraLatitude, alt, 0, 90, 0, 100, 3);
		if(cameras && cameras[curSelNodeId]){
			$("#btnConfirm").removeAttr("disabled");
		}
	}
}

/**
 * 单击事件-设置当前选中摄像头ID
 * @param  {[type]} event    [事件]
 * @param  {[type]} treeId   [树节点ID]
 * @param  {[type]} treeNode [树节点Node]
 * @return {[type]}          [description]
 */
var onClick = function(event, treeId, treeNode) {
	if(treeNode) {
		if(treeNode.isParent) {
			curSelNodeId = null;
			return;
		}

		curSelNodeId = treeNode.id;//当前控制的摄像机节点
	}
}

/**
 * 关闭摄像头
 */
function closeCameras() {
	for(var id in cameras) {
		if(cameras.hasOwnProperty(id)) {
			if(cameras[id]) {
				//关闭视频
				cameras[id].camera.EnableCameraShot = false;
				cameras[id].camera.EnableMediaStream = false;
				layer.DetachWithDeleteObject(cameras[id].camera);
				layer.DetachWithDeleteObject(cameras[id].bindElement);
			}
		}
	}
	existingCamera.cCamera = null;
	existingCamera.cBindElement = null;
	existingCamera.cNum = null;
	existingCamera.cDeviceID = null;
	cameras = [];
	cameraOpenedId = [];
}

/**
 * 调整工具条高度
 */
function resetEarthToolHeight() {
	var oLength = 0;
	for(var i in cameras) {
		oLength++;
	}
	if(top.earthToolsBalloon && oLength > 0) { //工具条调整
		top.hideProfile();
		if(oLength <= 4) { //减少1/4
			top.resizeEarthTool(top.earthToolHeight * 3 / 4);
		} else { //减少1/2
			top.resizeEarthTool(top.earthToolHeight / 2);
		}
	} else { //还原
		top.resizeEarthTool();
	}
}

/**
 * 设置div高度
 */
function setDivHeight() {
	var newNorthHeight = $(window).height() - 276; //上方的高度
	$("#divTreeParent").css("height", newNorthHeight - 99 - 60); //默认47
}

/**
 * 屏蔽右键菜单
 * @return {[type]} [description]
 */
window.oncontextmenu = function(){
	return false;
}