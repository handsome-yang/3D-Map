/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：模型导入相关功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 13日
 ******************************************/

var dataPro; //数据处理对象
var datum; //基础数据

if(!STAMP) {
	var STAMP = {};
}

/**
 * 导出shape文件
 * @param  {earth} usearth        [description]
 * @param  {[type]} savePath       [description]
 * @param  {[type]} spatialRefPath [description]
 * @return {[type]}                [description]
 */
STAMP.ImportBuilding = function(usearth, savePath, spatialRefPath, field, floor, height, allFieldAndValue) {
	var importBuilding = {};
	var dataDictionary = {};
	var latObj;

	/**
	 * 导入文件 这里只针对面提供拉伸处理
	 * @param  {[type]} shapePath      [description]
	 * @param  {[type]} spatialRefPath [description]
	 * @param  {[type]} layerType      [description]
	 * @return {[type]}                [description]
	 */
	var _importFile = function(field, floor, height, userdata) {

		//如果shape已经导入过一次 再次导入的时候 先清理掉之前的 同时删除userdata上对应节点
		if(dataDictionary[savePath]) {
			var f = dataDictionary[savePath];
			for(var h = f.length - 1; h >= 0; h--) {
				var obj = f[h];
				usearth.DetachObject(obj);
			};
		}

		//载入数据处理对象
		dataPro = document.getElementById("dataProcess");
		dataPro.Load();

		var ogrDataProcess = dataPro.OGRDataProcess;
		var driver = ogrDataProcess.GetDriverByType(44);
		//SHAPE的路径
		var readData = driver.Open(savePath, 0);
		var layerNum = readData.GetLayerCount();

		//加载空间参考文件(投影变换)
		var spatialRef = dataPro.CoordFactory.CreateSpatialRef();
		spatialRef.InitFromFile(spatialRefPath);
		datum = dataPro.CoordFactory.CreateDatum();
		datum.init(spatialRef);

		//根据field与floor来计算每一个feature对应的高度值
		var fFieldValues;
		var fFloorValues;
		var fieldSum = allFieldAndValue.length;
		for(var i = fieldSum - 1; i >= 0; i--) {
			if(field === allFieldAndValue[i].key) {
				fFieldValues = allFieldAndValue[i].value;
			}
			if(floor === allFieldAndValue[i].key) {
				fFloorValues = allFieldAndValue[i].value;
			}
		};

		var readLayer;
		var lonLat;
		var type;
		var features = [];

		var rootxml = getUserdata(filename);

		for(var i = 0; i < layerNum; i++) {
			readLayer = readData.GetLayer(i);

			var featureNum = readLayer.GetFeatureCount();
			for(var j = 0; j < featureNum; j++) {
				//获取feature
				var feature = readLayer.GetFeature(j);
				//获取feature对应的属性字段
				var featureDefn = feature.GetFeatureDefn();
				type = feature.GetGeometryType();
				//获取空间信息
				var v3s;
				var guid = usearth.Factory.CreateGUID();
				//判断几何类型 参见SEWkbGeometryType枚举类型
				if(type === 3 || type === 403) { // 面
					var poly = feature.GetPolygon();
					v3s = transformPolygon(poly);

					var elementVolume = usearth.Factory.CreateElementVolume(guid, "拉伸体");
					//这里根据页面上的"名称字段"来给对象赋name属性值
					elementVolume.name = fFieldValues[j];
					elementVolume.BeginUpdate();
					var newPolygon = usearth.Factory.CreatePolygon();
					newPolygon.AddRing(v3s);
					elementVolume.SetPolygon(1, newPolygon);
					elementVolume.Height = fFloorValues[j] * height;
					elementVolume.FillColor = parseInt("0x" + "96ff0000");
					elementVolume.Visibility = true;
					elementVolume.EndUpdate();
					usearth.AttachObject(elementVolume);
					features.push(elementVolume);
					var beginPoint = v3s.Items(0);
					if(beginPoint) {
						lonLat = [beginPoint.X, beginPoint.Y, beginPoint.Z];
					}
					//保存到本地xml中
					createElementLocal(elementVolume, rootxml);
					//还要添加到userdataAry数组中 否则右键不会立即生效
					userdata.addElementFromOuter(elementVolume);
					//添加到左侧面板树显示列表中
					var tempzTree = earth.tempUserdataTree;
					if(tempzTree == null) {
						return;
					}
					var tempRootNode = tempzTree.getNodes()[0];
					var iconPath = userdata.getUserdataIcon("207", true); //icon文件
					tempzTree.addNodes(tempRootNode, {
						id: elementVolume.guid,
						pId: -1,
						name: elementVolume.name,
						checked: true,
						icon: iconPath
					}, false);
				} else {
					alert("类型不正确!");
					return;
				}
			}
		}
		dataDictionary[savePath] = features;
		if(lonLat != []) {
			usearth.GlobeObserver.FlytoLookat(lonLat[0], lonLat[1], 50, 0, 60, 0, 200, 5);
			latObj = {
				lon: lonLat[0],
				lat: lonLat[1]
			};
		}
		alert("导入成功!");
		$("#selectVect").attr("disabled", false);
		$("#selectPath").val('');
		$("#addSpatialReference").attr("disabled", false);
		$("#referenceInput").val('');
		$("#floorHeight").val('');
		$("#filed").empty();
		$("#floor").empty();
		$("#clear").attr("disabled", false);
	}

	/**
	 * 添加到userdata中
	 * @return {[type]} [description]
	 */
	var createElementLocal = function(element, rootxml) {

		var xmlData = createElementXml(element);
		var xmlDoc = loadXMLStr("<xml>" + xmlData + "</xml>");

		var lookupNode = null;

		if(rootxml.childNodes.length > 1) {
			lookupNode = rootxml.childNodes[rootxml.childNodes.length - 1].firstChild;
		} else {
			lookupNode = rootxml.documentElement.firstChild;
		}
		lookupNode.appendChild(xmlDoc.documentElement.firstChild);

		var root = usearth.Environment.RootPath + "userdata\\" + filename;
		usearth.UserDocument.saveXmlFile(root, rootxml.xml);
	}

	//todo:这里代码需要优化一下 .... 修改为直接从userdata中获取xml即可
	var filename = "MyPlace";
	var getUserdata = function(filename) {
		var url = usearth.Environment.RootPath + "userdata\\" + filename + ".xml";
		var xmlData = usearth.UserDocument.loadXmlFile(url); // 得到xml数据；
		if(xmlData == "") {
			var userdataGUID = usearth.Factory.createGuid();
			var userdataXml = "<Xml><ElementDocument id='" + userdataGUID + "' name='MyPlace' im0='folderOpen.gif' type='folder' checked='0' open='false'></ElementDocument></Xml>";
			var userdata = usearth.Environment.RootPath + "userData\\" + filename;
			usearth.UserDocument.saveXmlFile(userdata, userdataXml);
			xmlData = userdataXml;
		}
		return loadXMLStr(xmlData);
	}

	/**
	 * 创建元素xml
	 * @param {Object} element  元素
	 */
	var createElementXml = function(element) {
		var xmlData = "";
		xmlData += "<Element id='" + element.guid + "' name='" + element.name + "' shadow_cast='1' type='" + element.rtti + "' checked='1' >";
		xmlData += " <Visibility>true</Visibility>";
		xmlData += " <Description></Description>";

		xmlData += "<TextureParams>";
		xmlData += "    <UniqueSideStyle>" + "" + "</UniqueSideStyle>";
		xmlData += "  <FillColor>" + "#" + element.FillColor.toString(16) + "</FillColor>";
		xmlData += "<LineColor>#ffc0c0c0</LineColor><DrawFrameEnable>false</DrawFrameEnable>";

		//新增属性
		xmlData += "  <Selectable>" + element.selectable + "</Selectable>";
		xmlData += "  <Editable>" + element.editable + "</Editable>";
		xmlData += "  <ObjectFlagType>" + element.objectFlagType + "</ObjectFlagType>";

		//这里要修改一下...贴图的写入
		var count = element.MaterialStyles.Count;
		for(var i = 0; i < count; i++) {
			xmlData += "    <TextureParam>";
			xmlData += "        <TexturePath>" + " " + "</TexturePath>";
			xmlData += "    </TextureParam>";
		}
		xmlData += "</TextureParams>";
		xmlData += "  <SphericalTransform><Location>" + element.SphericalTransform.Longitude + "," + element.SphericalTransform.Latitude + "," + element.SphericalTransform.Altitude + "</Location></SphericalTransform>";

		var pList = "";
		var vector3s = element.Vectors;
		for(var i = 0; i < vector3s.Count; i++) {
			var point = vector3s.Items(i);
			pList += point.X + "," + point.Y + "," + point.Z + " ";
		}
		xmlData += "  <Volume><PointList>" + pList + " </PointList>";
		xmlData += " <Height>" + element.Height + "</Height></Volume>";

		var Rotation = element.SphericalTransform.GetRotation();
		var Scale = element.SphericalTransform.GetScale();
		var Position = element.SphericalTransform.GetLocation();

		xmlData += " <ControlParams>";
		xmlData += "    <Rotation>" + Rotation.X + "," + Rotation.Y + "," + Rotation.Z + "</Rotation>";
		xmlData += "    <Scale>" + Scale.X + "," + Scale.Y + "," + Scale.Z + "</Scale>";
		xmlData += "    <Position>" + Position.X + "," + Position.Y + "," + Position.Z + "</Position>";
		xmlData += " </ControlParams>";

		var heading = usearth.GlobeObserver.Pose.heading;
		var tilt = usearth.GlobeObserver.Pose.tilt;
		var range = usearth.GlobeObserver.PickRange();

		xmlData += " <LookAt>";
		xmlData += "  <Longitude>" + element.SphericalTransform.Longitude + "</Longitude>";
		xmlData += "  <Latitude>" + element.SphericalTransform.Latitude + "</Latitude>";
		xmlData += "  <Altitude>" + element.SphericalTransform.Altitude + "</Altitude>";
		xmlData += "  <Heading>" + 0 + "</Heading>";
		xmlData += "  <Tilt>" + 60 + "</Tilt>";
		xmlData += "  <Range>" + 200 + "</Range>";
		xmlData += " </LookAt>";

		xmlData += "</Element>";
		return xmlData;
	};

	/**
	 * 获取位置对象
	 */
	var getLocationObj = function() {
		if(latObj) {
			return latObj;
		}
		return null;
	}

	// 对线数据进行空间数据转换
	var transformPolygon = function(poly) {
		var inerLine = poly.GetExteriorRing();
		var wInerLine = transformLinearRing(inerLine);
		var v3s = usearth.Factory.CreateVector3s();
		for(var k = 0; k < wInerLine.length; k++) {
			var v = wInerLine[k];
			var v3 = usearth.Factory.CreateVector3();
			v3.X = v.X;
			v3.Y = v.Y;
			var altitude = usearth.Measure.MeasureTerrainAltitude(v.X, v.Y);
			v3.Z = altitude;
			v3s.AddVector(v3);
		}
		return v3s;
	}

	/**
	 * 线性变换
	 * @param {Object} line  线F
	 */
	var transformLinearRing = function(line) {
		var result = [];
		var pointNum = line.GetPointsCount();
		for(var j = 0; j < pointNum; j++) {
			var point = line.GetPoint(j);
			var rawPoint = TransformPoint(point);
			result.push(rawPoint);
		}

		return result;
	}

	// 对点数据进行空间数据转换 平面转经纬度
	var TransformPoint = function(point) {
		var rawPoint = datum.src_xy_to_des_BLH(point.X, point.Y, 0);
		return rawPoint;
	}

	/**
	 * 给layer赋属性字段
	 * @param {[type]} layer      [description]
	 * @param {[type]} attributes [description]
	 */
	function addFieldToLayer(layer, attributes) {
		result = [];
		for(var m = 0; m < attributes.length; m++) {
			var field = attributes[m]["key"];
			//alert(field);
			var fieldDefnWrite1 = dataPro.OGRDataProcess.OGRFactory.CreateSEOGRFieldDefn(field, 4);
			layer.CreateField(fieldDefnWrite1);

			result.push(fieldDefnWrite1);
		}
		return result;
	}

	/**
	 * 增加点
	 * @param {Object} part  部分
	 * @param {Object} polygon  多边形
	 * @param {Object} isMult  是否有多个
	 */
	var addRings = function(part, polygon, isMult) {
		var linearRing = dataPro.OGRDataProcess.OGRFactory.CreateOGRLinearRing();
		var vecs = part.split(" ");
		for(var j = 0; j < vecs.length; j++) {
			var v3 = dataPro.OGRDataProcess.OGRFactory.CreateOGRPoint();
			var part = vecs[j].split(",");
			v3.X = part[0];
			v3.Y = part[1];
			v3.Z = part[2];
			var pt = datum.des_BLH_to_src_xy(v3.X, v3.Y, 0);
			linearRing.SetPointOfXYZ(j, pt.X, pt.Y, pt.Z);
		}
		//如果有多个part
		if(isMult) {
			var partPolygon = dataPro.OGRDataProcess.OGRFactory.CreateOGRPolygon();
			partPolygon.AddRing(linearRing);
			polygon.AddGeometry(partPolygon);
		} else {
			polygon.AddRing(linearRing);
		}
		return polygon;
	};

	/**
	 * 增加线处理
	 * @param {Object} part  部分
	 * @param {Object} line  线
	 */
	var addLineRings = function(part, line) {
		var vecs = part.split(" ");
		for(var j = 0; j < vecs.length; j++) {
			var v3 = dataPro.OGRDataProcess.OGRFactory.CreateOGRPoint();
			var part = vecs[j].split(",");
			v3.X = part[0];
			v3.Y = part[1];
			v3.Z = part[2];
			var pt = datum.des_BLH_to_src_xy(v3.X, v3.Y, 0);
			line.SetPointOfXYZ(j, pt.X, pt.Y, pt.Z);
		}
		return line;
	}

	/**
	 * 创建矢量
	 * @param {Object} layer  图层
	 * @param {Object} vects  矢量
	 * @param {Object} attributes  属性
	 * @param {Object} fields  字段
	 * @param {Object} type  类型
	 */
	function createFeatures(layer, vects, attributes, fields, type) {

		if(vects instanceof Array) {

			for(var i = vects.length - 1; i >= 0; i--) {
				var name = "feature";
				var ogrDataProcess = dataPro.OGRDataProcess;
				//创建要素属性 从layer中把字段赋值过来
				var featureDefn = ogrDataProcess.OGRFactory.CreateFeatureDefn(name);
				for(var f = 0; f < fields.length; f++) {
					featureDefn.AddFieldDefn(fields[f]);
				}

				//创建Feature要素(关联要素属性表)
				var feature = ogrDataProcess.OGRFactory.CreateFeature(featureDefn);

				//创建面或者线对象
				if(type === 211) { //面
					var polygon = dataPro.OGRDataProcess.OGRFactory.CreateOGRPolygon();
					var part = vects[i];
					polygon = addRings(part, polygon);
					feature.SetGeometryDirectly(polygon);
				} else if(type === 220) { //线
					var line = dataPro.OGRDataProcess.OGRFactory.CreateOGRLineString();
					var part = vects[i];
					line = addLineRings(part, line);
					feature.SetGeometryDirectly(line);
				}

				//给feature的字段赋值
				for(var m = 0; m < attributes.length; m++) {
					var fieldValue = attributes[m]["value"];
					var fieldWrite = dataPro.OGRDataProcess.OGRFactory.CreateOGRField(4); //string
					fieldWrite.SetFieldAsString(fieldValue);
					feature.SetField(m, fieldWrite);
				}
				layer.SetFeature(feature);
			};
		}
	}

	/**
	 * 获取数据源
	 * @param {Object} path  类型
	 */
	function getWriteDataSource(path) {
		var ogrDataProcess = dataPro.OGRDataProcess;
		var driver = ogrDataProcess.GetDriverByType(44);
		//这里的path路径在底层没有做最后的字符判断...底层问题 这里先在前端处理一下 底层要做容错性处理
		return driver.CreateDataSource(path);
	}

	/**
	 * 获取位置对象
	 */
	var _getLocationObj = function() {
		if(latObj) {
			return latObj;
		}
		return null;
	}

	importBuilding.importFile = _importFile;
	importBuilding.getLocationObj = _getLocationObj;
	return importBuilding;
}