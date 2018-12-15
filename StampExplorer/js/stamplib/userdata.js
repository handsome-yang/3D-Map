/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：用户数据脚本
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 13日
 ******************************************/

var userdataArr = []; //element数组
var editDataArr = self.editDataArr || parent.editDataArr; //编辑数据组
var earth = null; //三维球
var treePIDObject = {}; //树对象
var nodeLevel = {}; //节点级别
var cameraArr = []; //摄像头数组
var queryHtmlBalloon = null; //风场数据气泡框
var deltemp = null; //删除临时对象
var treeRootName = "用户数据"; //根节点目录名
var explosionTimeOut = 5000; //爆炸延时
var explosionTimes = 10; //爆炸次数
var dictionaryExplosion = {};
var timerAll = {}; // 所有的延时器
var currentHighlightObj = null;

if(!STAMP) {
	var STAMP = {};
}
var filename = "MyPlace"; //文件名
STAMP.Userdata = function(earthObj) {
	if(earthObj) {
		earth = earthObj;
	} else {
		earth = self.earth || parent.earth;
	}
	var userdata = {};
	/**
	 * 初始化element对象
	 */
	var _initDataArr = function(filenames) {
		filename = filenames;
		var userdataDoc = getUserdata(filenames);
		userdataArr = getAllIconObjs(userdataDoc);
	};

	/**
	 * 创建EditLayer
	 */
	var EditLayer = null;
	var createLayer = function() {
		EditLayer = earth.Factory.CreateEditLayer(earth.Factory.createGuid(), "my_layer", earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 1000), 0, 1000, '');
		earth.AttachObject(EditLayer);
	}

	/**
	 *  每次添加对象的时候不再741n1tTree 执行数据更新即可
	 */
	function updateTree(data) {
		var thisType = data.type ? data.type.toString() : "";
		try {
			if(top.getOperObject() && top.getOperObject().$("#userDataTree") && top.getOperObject().$("#userDataTree").length > 0) {
				var tempzTree = top.getOperObject().$.fn.zTree.getZTreeObj("userDataTree");
				if(tempzTree == null) {
					return;
				}
				var tempRootNode = tempzTree.getNodes()[0];
				var iconPath = getUserdataIcon(thisType, true);
				tempzTree.addNodes(tempRootNode, {
					id: data.guid,
					pId: -1,
					name: data.name,
					icon: iconPath,
					checked: true
				}, false);
			}
		} catch(e) {

		}
	}

	/**
	 * [ description]
	 * @return {[type]} [description]
	 */
	var _createParticle = function(flag) {
		var guid = earth.Factory.CreateGuid();
		var obj = {};
		obj.action = "add";
		obj.earth = earth;
		obj.guid = guid;

		var particleType;
		switch(flag) {
			case 0:
				particleType = "fire";
				obj.name = "fire";
				obj.type = "fire";
				break;
			case 1:
				particleType = "mist";
				obj.name = "mist";
				obj.type = "mist";
				break;
			case 2:
				particleType = "fountain";
				obj.name = "fountain";
				obj.type = "fountain";
				break;
			case 3:
				particleType = "nozzle";
				obj.name = "nozzle";
				obj.type = "nozzle";
				break;
			case 4:
				particleType = "SprayNozzle";
				obj.name = "SprayNozzle";
				obj.type = "SprayNozzle";
				break;
			case 5:
				particleType = "WaterGunSmall";
				obj.name = "WaterGunSmall";
				obj.type = "WaterGunSmall";
				break;
			case 6:
				particleType = "Explosion";
				obj.name = "Explosion";
				obj.type = "Explosion";
				break;
			default:
				particleType = "";
				break;
		}

		earth.Event.OnCreateGeometry = function(pt, type) {
			if(pt) {
				window.showModalDialog("html/userdata/getParticleName.html", obj, "dialogWidth=240px;dialogHeight=105px;status=no");
				var name = obj.name;
				if(obj.name == "") {
					return;
				}
				if(obj.click === "false") {
					return;
				}
				var particle = earth.factory.CreateElementParticle(guid, name);
				particle.SphericalTransform.SetLocationEx(pt.Longitude, pt.Latitude, pt.Altitude);
				if(flag == 6) {
					particle.BeginUpdate();
					particle.Type = flag; //   火 = 0,  烟 = 1,  喷泉 = 2, 直流喷泉 = 3,   喷雾喷泉 = 4,  喷雾水枪 = 5,   爆炸 = 6
					particle.EndUpdate();

					var explosionFlag = earth.Factory.CreateGuid(); //唯一标识
					dictionaryExplosion[particle.guid] = explosionFlag;
					_beginExplosion(particle, explosionTimes, explosionFlag);
				} else {
					particle.BeginUpdate();
					particle.Type = flag; //   火 = 0,  烟 = 1,  喷泉 = 2, 直流喷泉 = 3,   喷雾喷泉 = 4,  喷雾水枪 = 5,   爆炸 = 6
					particle.EndUpdate();
				}

				earth.AttachObject(particle);
				userdataArr.push(particle);
				updateTree(obj);
				createElement(obj, particle);
				treePIDObject[guid] = 0;
			}

		};
		earth.ShapeCreator.CreatePoint();
	}

	/**
	 * 创建图元
	 * @param flag 根据flag判断创建图元类型
	 * @return treetag 创建成功true 否false
	 */
	var _createPrimitives = function(flag, userdataTree) {
		earth.Event.OnSelectChanged = function() {};
		var flagArr = [];
		if(flag.indexOf("_") >= 0) {
			flagArr = flag.split("_");
			flag = flagArr[0];
		}
		var userdataObj = {};
		userdataObj.action = "add";
		userdataObj.earth = earth;
		earth.ShapeCreator.Clear();
		if(flag == "createline") {
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval.Count) {
					if(pval.Count < 2) {
						alert("至少绘制2个点");
						return;
					}
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.type = 220;
					userdataObj.name = "line";
					var rValue = showModalDialog("html/userdata/2DEdit.html", userdataObj, "dialogWidth=300px;dialogHeight=595px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var lineGuid = earth.Factory.CreateGUID();
					userdataObj.guid = lineGuid;
					elementLine = earth.Factory.CreateElementLine(lineGuid, userdataObj.name);
					elementLine.BeginUpdate();
					elementLine.SetPointArray(pval);
					elementLine.Visibility = true;
					elementLine.LineStyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
					elementLine.LineStyle.LineWidth = userdataObj.linewidth;
					elementLine.AltitudeType = userdataObj.shadow;
					elementLine.Visibility = true;
					elementLine.ArrowType = userdataObj.arrow;
					//新增属性
					elementLine.Selectable = userdataObj.selectable;
					elementLine.Editable = userdataObj.editable;
					elementLine.DrawOrder = userdataObj.drawOrder;
					elementLine.EndUpdate();
					earth.AttachObject(elementLine);

					//保存到本地xml
					userdataObj.lineLength = elementLine.length;
					createElement(userdataObj, elementLine);
					userdataArr.push(elementLine);
					updateTree(userdataObj);
					treePIDObject[lineGuid] = 0;
					earth.ShapeCreator.Clear();
				}
			};
			earth.ShapeCreator.CreatePolyline(2, 16711680);
		} else if(flag == "icon") {
			earth.Event.OnCreateGeometry = function(pVal) {
				if(pVal) {
					userdataObj.path = earth.Environment.RootPath + "userres" + "\\";
					userdataObj.type = 209;
					userdataObj.name = "icon";
					var rValue = showModalDialog("html/userdata/iconData.html", userdataObj, "dialogWidth=354px;dialogHeight=595px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;
					userdataObj.longitude = pVal.Longitude;
					userdataObj.latitude = pVal.Latitude;
					userdataObj.altitude = pVal.Altitude;
					var strHightlightIcon = userdataObj.iconSelectedFileName;
					var iconName = userdataObj.name;
					var myicon = earth.Factory.CreateElementIcon(userdataObj.guid, userdataObj.name);
					myicon.Visibility = true;
					//新增属性
					myicon.textFormat = parseInt("0x100");
					myicon.textColor = parseInt("0x" + userdataObj.textColor.toString().substring(1).toLowerCase());
					myicon.textHorizontalScale = userdataObj.textHorizontalScale;
					myicon.textVerticalScale = userdataObj.textVerticalScale;
					myicon.showHandle = userdataObj.showHandle;
					myicon.handleHeight = userdataObj.handleHeight;
					myicon.handleColor = parseInt("0x" + userdataObj.handleColor.toString().substring(1).toLowerCase());
					myicon.minVisibleRange = userdataObj.minVisibleRange;
					myicon.maxVisibleRange = userdataObj.maxVisibleRange;
					myicon.selectable = userdataObj.selectable;
					myicon.editable = userdataObj.editable;
					myicon.LineSize = 7;
					myicon.Create(userdataObj.longitude, userdataObj.latitude, userdataObj.altitude, userdataObj.iconNormalFileName, userdataObj.iconSelectedFileName, userdataObj.name);

					earth.AttachObject(myicon);
					userdataArr.push(myicon);
					createElement(userdataObj, myicon);
					updateTree(userdataObj);
					treePIDObject[userdataObj.guid] = 0;
				}
			}
			earth.ShapeCreator.CreatePoint();
		} else if(flag == "createpolygon") {
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval.Count) {
					if(pval.Count < 3) {
						alert("至少绘制3个点");
						earth.ShapeCreator.Clear();
						return;
					}
					//添加自相交检测
					var isSelfIntersected = earth.PolygonAlgorithm.IsPolygonSelfIntersected(pval);
					if(isSelfIntersected) {
						alert("多边形自相交，请重新绘制!");
						earth.ShapeCreator.Clear();
						earth.ShapeCreator.CreatePolygon();
					} else {
						debugger
						userdataObj.type = 211;
						userdataObj.name = "polygon";
						userdataObj.path = earth.Environment.RootPath;
						var polygonGuid = earth.Factory.CreateGUID();
						userdataObj.guid = polygonGuid;
						var elementPolygon = earth.Factory.CreateElementPolygon(polygonGuid, userdataObj.name);
						elementPolygon.BeginUpdate();
						elementPolygon.SetExteriorRing(pval);
						var area = elementPolygon.area;
						userdataObj.area = Math.abs(area);
						userdataObj.perimeter = elementPolygon.perimeter;
						var rValue = showModalDialog("html/userdata/2DEdit.html", userdataObj, "dialogWidth=300px;dialogHeight=590px;status=no");
						if(userdataObj.click == true || userdataObj.click == "true") {} else {
							earth.ShapeCreator.Clear();
						}
						elementPolygon.LineStyle.LineWidth = userdataObj.linewidth;
						elementPolygon.LineStyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
						elementPolygon.AltitudeType = userdataObj.shadow;
						elementPolygon.FillStyle.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
						elementPolygon.DrawOrder = userdataObj.drawOrder;
						elementPolygon.Selectable = userdataObj.selectable;
						elementPolygon.Editable = userdataObj.editable;
						elementPolygon.EndUpdate();
						earth.AttachObject(elementPolygon);
						createElement(userdataObj, elementPolygon);
						userdataArr.push(elementPolygon);
						updateTree(userdataObj);
						treePIDObject[polygonGuid] = 0;
						earth.ShapeCreator.Clear();
					}
				}
			};
			earth.ShapeCreator.CreatePolygon();
		} else if(flag === "lineBuffer") {
			earth.Environment.SetCursorStyle(32512);
			earth.Event.OnLBUp = function(p2) {
				function _onlbd(p2) {
					earth.Event.OnLBDown = function(p2) {
						earth.Event.OnLBUp = function(p2) {
							_onlbd(p2);
						};
					};
					earth.Query.PickObject(511, p2.x, p2.y);
				}
				_onlbd(p2);
			};
			earth.Event.OnRBDown = function() {
				earth.Event.OnPickObjectEx = function() {};
				earth.Event.OnPickObject = function() {};
				earth.Event.OnLBDown = function() {};
				earth.Event.OnLBUp = function() {};
				earth.Query.FinishPick();
				earth.Environment.SetCursorStyle(209);
				//结束编辑状态
				earth.ToolManager.SphericalObjectEditTool.Browse();
			}
			earth.Event.OnPickObject = onPickObject;

			/**
			 * 选择对象完成事件
			 * @param {Object} pObj 选择对象
			 */
			function onPickObject(pObj) {
				earth.Query.FinishPick();
				earth.Event.OnLBDown = function() {};
				earth.Event.OnLBDown = function() {};
				var pCounts = pObj.pointCount;
				if(pCounts == undefined) {

				} else {
					earth.Environment.SetCursorStyle(209);
					//结束编辑状态
					earth.ToolManager.SphericalObjectEditTool.Browse();
					var rValue = showModalDialog("html/userdata/lineBuffer.html", null, "dialogWidth=250px;dialogHeight=187px;status=no");
					if(!rValue) {
						earth.Event.OnPickObjectEx = function() {};
						earth.Event.OnPickObject = function() {};
						earth.Event.OnLBDown = function() {};
						earth.Event.OnLBUp = function() {};
						earth.Query.FinishPick();
						earth.Environment.SetCursorStyle(209);
						return false;
					}

					var selectedObj = earth.Factory.CreateGeoPoints();
					for(var i = 0; i < pCounts; i++) {
						pointNode = pObj.GetPoint(i);
						selectedObj.Add(pointNode.x, pointNode.y, pointNode.z);
					}
					var bufGeoPoints = null;
					if(rValue.bufferStyle == "pingtou") {
						bufGeoPoints = earth.GeometryAlgorithm.CreatePolygonBufferFromPolyline(selectedObj, rValue.leftRadius, 1, 36);
					} else if(rValue.bufferStyle == "yuantou") {
						bufGeoPoints = earth.GeometryAlgorithm.CreatePolygonBufferFromPolyline(selectedObj, rValue.leftRadius, 0, 36);
					}
					var pt = null;
					var vec3s = earth.Factory.CreateVector3s();
					for(var i = 0; i < bufGeoPoints.Count; i++) {
						pt = bufGeoPoints.GetPointAt(i);
						vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude);
					}
					var bufferGuid = earth.Factory.CreateGUID();
					var bufPolygom = earth.Factory.CreateElementPolygon(bufferGuid, "LineBuffer");
					bufPolygom.BeginUpdate();
					bufPolygom.SetExteriorRing(vec3s);
					userdataObj.area = Math.abs(bufPolygom.area);
					userdataObj.perimeter = bufPolygom.perimeter;
					userdataObj.shadow = bufPolygom.AltitudeType = "1";
					userdataObj.drawOrder = bufPolygom.DrawOrder = "0";
					userdataObj.selectable = bufPolygom.Selectable = "true";
					userdataObj.editable = bufPolygom.Editable = "true";
					userdataObj.type = 211;
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.name = "LineBuffer";
					userdataObj.guid = bufferGuid;

					userdataObj.AltitudeType = bufPolygom.AltitudeType;

					var linecolor = "#ffff0000";
					var fillcolor = "#2500ff00";
					userdataObj.fillcolor = fillcolor;
					userdataObj.linecolor = linecolor;

					linecolor = "0x" + linecolor.toString().substring(1).toLowerCase();
					fillcolor = "0x" + fillcolor.toString().substring(1).toLowerCase();

					bufPolygom.LineStyle.LineColor = parseInt(linecolor);
					bufPolygom.LineStyle.LineWidth = 1;
					bufPolygom.FillStyle.FillColor = parseInt(fillcolor);
					bufPolygom.EndUpdate();
					earth.AttachObject(bufPolygom);

					createElement(userdataObj, bufPolygom);
					userdataArr.push(bufPolygom);
					updateTree(userdataObj);
					treePIDObject[bufferGuid] = 0;

				}
			}
		} else if(flag == "createcurve") { //曲线
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval.Count) {
					if(pval.Count < 2) {
						alert("至少绘制2个点");
						return;
					}
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.type = 229;
					userdataObj.name = "curve";
					var rValue = showModalDialog("html/userdata/2DEdit.html", userdataObj, "dialogWidth=300px;dialogHeight=555px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;

					var curve = earth.Factory.CreateElementCurve(guid, userdataObj.name);
					curve.BeginUpdate();
					curve.SetControlPointArray(pval);
					var linestyle = curve.LineStyle;
					linestyle.LineWidth = userdataObj.linewidth;
					linestyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
					curve.AltitudeType = userdataObj.shadow;
					curve.ArrowType = userdataObj.arrow;
					//新增属性
					curve.Selectable = userdataObj.selectable;
					curve.Editable = userdataObj.editable;
					curve.DrawOrder = userdataObj.drawOrder;

					curve.EndUpdate();
					userdataArr.push(curve);
					earth.AttachObject(curve);
					createElement(userdataObj, curve);
					updateTree(userdataObj);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			}
			earth.ShapeCreator.CreateCurve();
		} else if(flag == "createcircle") { //圆
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					userdataObj.type = 227;
					userdataObj.name = "circle";
					userdataObj.path = earth.Environment.RootPath;
					//半径
					userdataObj.radius = pval.Radius;
					var rValue = showModalDialog("html/userdata/2DEdit.html", userdataObj, "dialogWidth=300px;dialogHeight=590px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;
					var circle = earth.Factory.CreateElementCircle(guid, userdataObj.name);
					var tran = circle.SphericalTransform;
					tran.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					circle.BeginUpdate();
					userdataObj.perimeter = circle.perimeter;
					userdataObj.area = circle.area;

					//新增属性
					circle.Selectable = userdataObj.selectable;
					circle.Editable = userdataObj.editable;
					circle.AltitudeType = userdataObj.shadow;
					circle.Radius = userdataObj.radius;
					circle.FillStyle.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					circle.LineStyle.LineWidth = userdataObj.linewidth;
					circle.LineStyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
					circle.EndUpdate();

					//这里有问题 属性取不到值
					userdataObj.perimeter = circle.perimeter;
					userdataObj.area = circle.area;

					userdataArr.push(circle);
					earth.AttachObject(circle);
					createElement(userdataObj, circle);
					updateTree(userdataObj);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			}
			earth.ShapeCreator.CreateCircle();

		} else if(flag === "createellipse") { //椭圆
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.type = 243;
					userdataObj.name = "ellipse";
					userdataObj.longRadius = pval.longRadius;
					userdataObj.shortRadius = pval.shortRadius;
					var rValue = showModalDialog("html/userdata/2DEdit.html", userdataObj, "dialogWidth=300px;dialogHeight=590px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;

					var ellipse = earth.Factory.CreateElementEllipse(guid, userdataObj.name);
					var tran = ellipse.SphericalTransform;
					tran.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					ellipse.BeginUpdate();
					ellipse.AltitudeType = userdataObj.shadow;
					//新增属性
					ellipse.Selectable = userdataObj.selectable;
					ellipse.Editable = userdataObj.editable;

					userdataObj.perimeter = ellipse.perimeter;
					userdataObj.area = ellipse.area;

					ellipse.LongRadius = userdataObj.longRadius;
					ellipse.ShortRadius = userdataObj.shortRadius;
					var fillstyle = ellipse.FillStyle;
					fillstyle.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					var linestyle = ellipse.LineStyle;
					linestyle.LineWidth = userdataObj.linewidth;
					linestyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
					ellipse.EndUpdate();
					userdataArr.push(ellipse);
					earth.AttachObject(ellipse);
					createElement(userdataObj, ellipse);
					updateTree(userdataObj);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			}
			earth.ShapeCreator.CreateEllipse();

		} else if(flag == "createsector") { //扇形
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					userdataObj.type = 228;
					userdataObj.name = "sector";
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.angle = pval.angle;
					userdataObj.radius = pval.radius;
					userdataObj.ArcCenter = pval.ArcCenter;
					var rValue = showModalDialog("html/userdata/2DEdit.html", userdataObj, "dialogWidth=300px;dialogHeight=590px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;
					var sector = earth.Factory.CreateElementSector(guid, userdataObj.name);
					var tran = sector.SphericalTransform;
					tran.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					sector.BeginUpdate();
					sector.ArcCenter = pval.ArcCenter;
					sector.radius = userdataObj.radius;
					//新增属性
					sector.Selectable = userdataObj.selectable;
					sector.Editable = userdataObj.editable;
					sector.AltitudeType = userdataObj.shadow;
					sector.Angle = Number(userdataObj.angle);
					var linestyle = sector.LineStyle;
					linestyle.LineWidth = userdataObj.linewidth;
					linestyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
					var fillstyle = sector.FillStyle;
					fillstyle.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());

					sector.EndUpdate();
					userdataArr.push(sector);
					earth.AttachObject(sector);
					createElement(userdataObj, sector);
					updateTree(userdataObj);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			}
			earth.ShapeCreator.CreateSector(30);

		} else if(flag == "createTexturePolygon") { //矢量面贴图
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval.Count) {
					if(pval.Count < 3) {
						alert("至少绘制3个点");
						return;
					}
					//添加自相交检测
					var isSelfIntersected = earth.PolygonAlgorithm.IsPolygonSelfIntersected(pval);
					if(isSelfIntersected) {
						alert("多边形自相交，请重新绘制!");
						earth.ShapeCreator.Clear();
						earth.ShapeCreator.CreatePolygon();
					} else {
						userdataObj.type = 245;
						userdataObj.name = "TexturePolygon";
						var guid = earth.Factory.CreateGuid();
						userdataObj.guid = guid;
						var rValue = showModalDialog("html/userdata/texturePolygon.html", userdataObj, "dialogWidth=300px;dialogHeight=590px;status=no");
						if(userdataObj.click == undefined || userdataObj.click == "false") {
							earth.ShapeCreator.Clear();
							return;
						}
						var polygon = earth.Factory.CreateElementTexturePolygon(userdataObj.guid, userdataObj.name);
						polygon.BeginUpdate();
						polygon.SetExteriorRing(pval);

						polygon.FillStyle.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
						polygon.TextureImagePath = userdataObj.picture;
						polygon.TextureMode = parseInt(userdataObj.textture); //  0 无纹理        1 平铺纹理   2 拉伸（必须四个顶点）
						polygon.TextureTiltX = parseInt(userdataObj.expandX); //  横向平铺重复次shu
						polygon.TextureTiltY = parseInt(userdataObj.expandY); //  纵向平铺重复次shu

						polygon.LineStyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
						polygon.LineStyle.LineWidth = parseInt(userdataObj.linewidth);
						polygon.AltitudeType = parseInt(userdataObj.shadow); // 0绝对 1贴地
						polygon.Selectable = userdataObj.selectable;
						polygon.Editable = userdataObj.editable;

						polygon.EndUpdate();

						earth.AttachObject(polygon);
						createElement(userdataObj, polygon);
						updateTree(userdataObj);
						userdataArr.push(polygon);
						treePIDObject[guid] = 0;
						earth.ShapeCreator.Clear();
					}
				}
			}
			earth.ShapeCreator.CreatePolygon();
		} else if(flag == "createrectangle") { //矩形贴图
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval.Count) {
					userdataObj.type = 245;
					userdataObj.name = "rectangle";
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;
					var rValue = showModalDialog("html/userdata/texturePolygon.html", userdataObj, "dialogWidth=300px;dialogHeight=590px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var rectangle = earth.Factory.CreateElementTexturePolygon(guid, userdataObj.name);
					rectangle.BeginUpdate();
					rectangle.SetExteriorRing(pval);
					rectangle.name = userdataObj.name;
					rectangle.FillStyle.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					rectangle.TextureImagePath = userdataObj.picture;
					rectangle.TextureMode = parseInt(userdataObj.textture); //  0 无纹理        1 平铺纹理   2 拉伸（必须四个顶点）
					rectangle.TextureTiltX = parseInt(userdataObj.expandX); //  横向平铺重复次shu
					rectangle.TextureTiltY = parseInt(userdataObj.expandY); //  纵向平铺重复次shu
					rectangle.LineStyle.LineColor = parseInt("0x" + userdataObj.linecolor.toString().substring(1).toLowerCase());
					rectangle.LineStyle.LineWidth = parseInt(userdataObj.linewidth);
					rectangle.AltitudeType = parseInt(userdataObj.shadow); // 0绝对 1贴地

					//新增属性
					rectangle.Selectable = userdataObj.selectable;
					rectangle.Editable = userdataObj.editable;

					rectangle.EndUpdate();

					earth.AttachObject(rectangle);
					createElement(userdataObj, rectangle);
					updateTree(userdataObj);
					userdataArr.push(rectangle);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			}
			earth.ShapeCreator.CreateRectangle();
		} else if(flag === "parallelLines") { //平行线
			earth.ToolManager.ElementEditTool.ParallelGeometry(0);
			earth.Event.OnGeometryParalleled = function(Coll, offset) {
				if(Coll) {
					if(Coll.Rtti === 229) {
						userdataObj.type = 229;
					} else {
						userdataObj.type = 220;
					}
					userdataObj.name = Coll.Name;
					userdataObj.drawOrder = 0;
					userdataObj.action = "parallel";
					//属性先从Coll中获取到 增加到userdata中
					userdataObj.linecolor = Coll.LineStyle.LineColor;
					userdataObj.linewidth = Coll.LineStyle.LineWidth;
					userdataObj.selectable = Coll.AltitudeType;
					userdataObj.selectable = Coll.Selectable;
					userdataObj.editable = Coll.Editable;
					userdataObj.drawOrder = Coll.DrawOrder;
					userdataObj.desc = "";
					userdataObj.shadow = 1;
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;
					userdataObj.lineLength = Coll.Length;
					var outPoly;
					var elementLine;
					if(userdataObj.type === 220) {
						outPoly = earth.GeometryAlgorithm.CreateParallelLine(Coll.GetPointArray(), offset, 1);
						elementLine = earth.Factory.CreateElementLine(guid, userdataObj.name);
						elementLine.BeginUpdate();
						elementLine.SetPointArray(outPoly);
					} else {
						outPoly = earth.GeometryAlgorithm.CreateParallelLine(Coll.GetControlPointArray(), offset, 1);
						elementLine = earth.Factory.CreateElementCurve(guid, userdataObj.name);
						elementLine.BeginUpdate();
						elementLine.SetControlPointArray(outPoly);
					}
					elementLine.LineStyle.LineColor = Coll.LineStyle.LineColor;
					elementLine.LineStyle.LineWidth = userdataObj.linewidth;
					elementLine.AltitudeType = userdataObj.shadow;
					elementLine.ArrowType = Coll.ArrowType;
					elementLine.Visibility = true;
					elementLine.Selectable = userdataObj.selectable;
					elementLine.Editable = userdataObj.editable;
					elementLine.DrawOrder = userdataObj.drawOrder;

					elementLine.EndUpdate();
					userdataObj.linecolor = "#" + elementLine.LineStyle.LineColor.toString(16);
					userdataObj.arrow = elementLine.ArrowType;
					earth.AttachObject(elementLine);
					createElement(userdataObj, elementLine);
					updateTree(userdataObj);
					userdataArr.push(elementLine);
					treePIDObject[guid] = 0;

					//结束编辑状态
					earth.ToolManager.SphericalObjectEditTool.Browse();
				}
			}
		} else if(flag === "parallelSurface") { //平行面
			earth.ToolManager.ElementEditTool.ParallelGeometry(1);
			earth.Event.OnGeometryParalleled = function(Coll, offset) {
				if(Coll) {
					if(Coll.Rtti === 227) {
						userdataObj.type = 227; //圆
						userdataObj.radius = Coll.Radius - offset;
					} else if(Coll.Rtti === 243) {
						userdataObj.type = 243; //椭圆
						userdataObj.longRadius = Coll.LongRadius - offset;
						userdataObj.shortRadius = Coll.ShortRadius - offset;
					} else {
						userdataObj.type = 211;
					}
					userdataObj.name = Coll.Name;
					userdataObj.drawOrder = 0;
					userdataObj.action = "parallel";
					//属性先从Coll中获取到 增加到userdata中
					userdataObj.shadow = Coll.AltitudeType;
					userdataObj.drawOrder = Coll.DrawOrder;
					//修改为自定义颜色
					userdataObj.linecolor = Coll.LineStyle.LineColor;
					userdataObj.fillcolor = Coll.FillStyle.FillColor;
					userdataObj.linewidth = Coll.LineStyle.LineWidth;
					//周长,面积
					userdataObj.perimeter = Coll.perimeter;
					userdataObj.area = Coll.area;

					userdataObj.selectable = true;
					userdataObj.editable = true;
					userdataObj.desc = "";

					var outPoly;
					var guid = earth.Factory.CreateGuid();
					userdataObj.guid = guid;
					var polygon;
					if(Coll.Rtti === 227) {
						polygon = earth.Factory.CreateElementCircle(guid, userdataObj.name); //圆
						polygon.SphericalTransform.SetLocationEx(Coll.SphericalTransform.GetLocation().X, Coll.SphericalTransform.GetLocation().Y, Coll.SphericalTransform.GetLocation().Z);
						polygon.BeginUpdate();
						polygon.Radius = userdataObj.radius;
					} else if(Coll.Rtti === 243) {
						polygon = earth.Factory.CreateElementEllipse(guid, userdataObj.name); //椭圆
						polygon.SphericalTransform.SetLocationEx(Coll.SphericalTransform.GetLocation().X, Coll.SphericalTransform.GetLocation().Y, Coll.SphericalTransform.GetLocation().Z);
						polygon.BeginUpdate();
						polygon.LongRadius = userdataObj.longRadius;
						polygon.ShortRadius = userdataObj.shortRadius;
					} else {
						outPoly = earth.GeometryAlgorithm.CreateParallelPolygon(Coll.GetExteriorRing(), offset, 1);
						polygon = earth.Factory.CreateElementPolygon(guid, userdataObj.name);
						polygon.BeginUpdate();
						polygon.SetExteriorRing(outPoly);
						polygon.DrawOrder = userdataObj.drawOrder;
					}
					polygon.LineStyle.LineWidth = userdataObj.linewidth;
					polygon.LineStyle.LineColor = userdataObj.linecolor;
					polygon.FillStyle.FillColor = userdataObj.fillcolor;
					polygon.AltitudeType = 1;
					//新增属性
					polygon.Selectable = userdataObj.selectable;
					polygon.Editable = userdataObj.editable;
					polygon.DrawOrder = userdataObj.drawOrder;
					polygon.EndUpdate();

					userdataObj.linecolor = "#" + polygon.LineStyle.LineColor.toString(16);
					userdataObj.fillcolor = "#" + polygon.FillStyle.FillColor.toString(16);

					userdataObj.perimeter = Coll.perimeter;
					userdataObj.area = Coll.area;

					earth.AttachObject(polygon);
					createElement(userdataObj, polygon);
					updateTree(userdataObj);
					userdataArr.push(polygon);
					treePIDObject[guid] = 0;

					//结束编辑状态
					earth.ToolManager.SphericalObjectEditTool.Browse();
				} else {
					alert("您选择的对象不可画平行面！");
				}
			}
		} else if(flag === "surfaceTosurface") { //面面求并, 面面求差, 面面求交
			userdataObj.type = 211;
			userdataObj.name = "polygon";
			earth.ToolManager.SphericalObjectEditTool.Select();
			var dataArr = [];
			earth.Event.OnSelectChanged = function(x) {
				var selectSet = earth.SelectSet;
				for(var i = 0; i < selectSet.GetCount(); i++) {
					var element = selectSet.GetObject(i);
					if(element.Rtti == 211) {
						dataArr.push(element.GetPolygon());
					} else {
						alert("请选择面");
						earth.ToolManager.SphericalObjectEditTool.Browse();
					}
				}
				if(dataArr.length >= 2) {
					earth.Event.OnSelectChanged = function() {};
					var relationship = earth.PolygonAlgorithm.PolysRelationship(dataArr[0], dataArr[1]);
					if(relationship != 3 && relationship != 1) {
						alert("请选择两个相交的面");
						return;
					}
					var a = earth.PolygonAlgorithm.PolysBoolOperation(dataArr[0], dataArr[1], flagArr[1]);
					for(var m = 0; m < a.Count; m++) {
						var guid = earth.Factory.createGuid();
						userdataObj.name = "polygon2";
						userdataObj.guid = guid;
						var polygon = earth.Factory.CreateElementPolygon(guid, "polygon2");

						polygon.BeginUpdate();
						polygon.SetPolygon(a.Items(m));
						polygon.LineStyle.LineWidth = 1;
						polygon.LineStyle.LineColor = parseInt(0xff88ffff);
						polygon.FillStyle.FillColor = parseInt(0xff88ffff);
						polygon.AltitudeType = 1;
						polygon.Selectable = true;
						polygon.Editable = true;
						polygon.DrawOrder = 0;
						polygon.EndUpdate();
						earth.AttachObject(polygon);
						userdataObj.linecolor = "#" + polygon.LineStyle.LineColor.toString(16);
						userdataObj.fillcolor = "#" + polygon.FillStyle.FillColor.toString(16);
						userdataObj.shadow = 1;
						userdataObj.selectable = true;
						userdataObj.editable = true;
						userdataObj.drawOrder = 0;
						createElement(userdataObj, polygon);
						updateTree(userdataObj);
						userdataArr.push(polygon);
						earth.Event.OnSelectChanged = function(x) {};
					}
					treePIDObject[guid] = 0;
				}
			}
		} else if(flag == "createsphere") {
			userdataObj.name = "sphere";
			userdataObj.type = 216;
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.radius = pval.Radius;
					var rValue = showModalDialog("html/userdata/3DEdit.html", userdataObj, "dialogWidth=305px;dialogHeight=470px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGUID();
					userdataObj.guid = guid;
					var elementSphere = earth.Factory.CreateElementSphere(guid, userdataObj.name);
					elementSphere.BeginUpdate();
					//新增属性
					elementSphere.Selectable = userdataObj.selectable;
					elementSphere.Editable = userdataObj.editable;
					elementSphere.Underground = userdataObj.objectFlagType;

					elementSphere.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					elementSphere.Radius = userdataObj.radius;
					var materialStyles = elementSphere.MaterialStyles;
					var count = materialStyles.Count;
					var materialStyle = materialStyles.Items(0);
					materialStyle.DiffuseTexture = userdataObj.texturePath[2];
					elementSphere.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					elementSphere.EndUpdate();
					createElement(userdataObj, elementSphere);
					earth.AttachObject(elementSphere);
					updateTree(userdataObj);
					userdataArr.push(elementSphere);
					earth.ShapeCreator.Clear();
				}
			};
			earth.ShapeCreator.CreateSphere(16711680);
		} else if(flag == "createbox") {
			userdataObj.type = 202;
			userdataObj.name = "box";
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					polyCount = 6;
					userdataObj.path = earth.Environment.RootPath;
					//新增属性
					userdataObj.longValue = pval.Length;
					userdataObj.widthValue = pval.Width;
					userdataObj.heightValue = pval.Height;
					var rValue = showModalDialog("html/userdata/3DEdit.html", userdataObj, "dialogWidth=305px;dialogHeight=640px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGUID();
					userdataObj.guid = guid;
					var elementBox = earth.Factory.CreateElementBox(guid, userdataObj.name);
					elementBox.BeginUpdate();
					elementBox.Selectable = userdataObj.selectable;
					elementBox.Editable = userdataObj.editable;

					elementBox.Underground = userdataObj.objectFlagType;
					elementBox.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);

					var materialStyles = elementBox.MaterialStyles;
					var count = materialStyles.Count;
					for(var i = 0; i < count; i++) {
						var materialStyle = materialStyles.Items(i);
						if(userdataObj.texturePath.length != 0) {
							materialStyle.DiffuseTexture = userdataObj.texturePath[i];
						}
					}
					elementBox.Width = userdataObj.widthValue;
					elementBox.Length = userdataObj.longValue;
					elementBox.Height = userdataObj.heightValue;

					elementBox.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					elementBox.EndUpdate();
					userdataArr.push(elementBox);
					earth.AttachObject(elementBox);
					createElement(userdataObj, elementBox);
					updateTree(userdataObj);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			};
			earth.ShapeCreator.CreateBox(16711680);
		}
		//创建淹没立方体
		else if(flag == "watersurround") {
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval.Count) {
					userdataObj.type = 211;
					userdataObj.name = "watersurround";
					userdataObj.path = earth.Environment.RootPath;
					var SubmergingGuid = earth.Factory.CreateGUID();
					var eleSubmerging = earth.Factory.CreatePolygonSubmerging(SubmergingGuid, userdataObj.name + "Submerging");
					eleSubmerging.BeginUpdate();
					eleSubmerging.SphericalVectors = pval;
					eleSubmerging.Selectable = userdataObj.selectable;
					eleSubmerging.Editable = userdataObj.editable;
					eleSubmerging.EndUpdate();
					earth.AttachObject(eleSubmerging);
					eleSubmerging.SetParam(50, 200, 5);
					eleSubmerging.Wave = 100;
					eleSubmerging.Start();
					earth.ShapeCreator.Clear();
				}
			};
			earth.ShapeCreator.CreatePolygon();
		}
		//创建风场立方体
		else if(flag == "createwindscene") {
			if(deltemp != null) {
				deleteFromEarth(deltemp);
			}
			userdataObj.type = 202;
			userdataObj.name = "windscene";
			//获取BOX的xyz值
			var boxvalue = earth.Factory.CreateVector3();
			boxvalue = earth.Measure.GetBoxParam();
			//获取box经纬度坐标
			var boxpos = earth.Factory.CreateVector3();
			boxpos = earth.Measure.GetBoxPos();
			var currentlayer = earth.Measure.GetCurrentLayer();
			var currentlayerheight = earth.Measure.GetCurrentLayerHeight();
			var getspeed = earth.Measure.GetSpeed();
			//定义数据数组
			var winddata = new Array();

			winddata.push("当前层数");
			winddata.push(currentlayer);
			winddata.push("当前高度");
			winddata.push(currentlayerheight);
			winddata.push("经度");
			winddata.push(boxpos.x);
			winddata.push("纬度");
			winddata.push(boxpos.y);
			winddata.push("风速");
			winddata.push(getspeed.x);
			winddata.push("风向");
			winddata.push(getspeed.y);
			var guid = earth.Factory.CreateGUID();
			var elementBox = earth.Factory.CreateElementBox(guid, userdataObj.name);
			deltemp = guid;
			//创建立方体所需参数
			elementBox.BeginUpdate();
			elementBox.Selectable = true;
			elementBox.Editable = true;
			elementBox.Underground = false;

			elementBox.SphericalTransform.SetLocationEx(boxpos.x, boxpos.y, boxpos.z);

			var materialStyles = elementBox.MaterialStyles;
			var count = materialStyles.Count;
			for(var i = 0; i < count; i++) {
				var materialStyle = materialStyles.Items(i);
				materialStyle.DiffuseTexture = "";

			}
			elementBox.Width = boxvalue.x;
			elementBox.Length = boxvalue.y;
			elementBox.Height = boxvalue.z - boxpos.z / 2;

			elementBox.FillColor = parseInt("0xccc0c0c0");
			elementBox.EndUpdate();
			userdataArr.push(elementBox);
			//使立方体高亮
			var winObj = _getElementByID(guid);
			winObj.ShowHighLight();
			earth.AttachObject(elementBox);
			//显示气泡框
			showwindscene(boxpos, winddata);

		} else if(flag == "createvolume") {
			userdataObj.type = 207;
			userdataObj.name = "volume";
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.heightValue = pval.Height;

					var rValue = showModalDialog("html/userdata/3DEdit.html", userdataObj, "dialogWidth=315px;dialogHeight=550px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGUID();
					userdataObj.guid = guid;
					var elementVolume = earth.Factory.CreateElementVolume(guid, userdataObj.name);
					elementVolume.BeginUpdate();
					elementVolume.Selectable = userdataObj.selectable;
					elementVolume.Editable = userdataObj.editable;
					elementVolume.Underground = userdataObj.objectFlagType;
					elementVolume.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					elementVolume.Height = userdataObj.heightValue;
					elementVolume.Vectors = pval.Vector3s;
					elementVolume.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					polyCount = pval.Vector3s.Count + 2;
					var materialStyles = elementVolume.MaterialStyles;
					var count = materialStyles.Count;
					for(var i = 0; i < count; i++) {
						var materialStyle = materialStyles.Items(i);
						materialStyle.DiffuseTexture = userdataObj.texturePath[i];
					}
					elementVolume.EndUpdate();
					createElement(userdataObj, elementVolume);
					earth.AttachObject(elementVolume);
					updateTree(userdataObj);
					userdataArr.push(elementVolume);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			};
			earth.ShapeCreator.CreateVolume(16711680);
		} else if(flag == "createcylinder") {
			polyCount = 3;
			userdataObj.type = 203;
			userdataObj.name = "cylinder";
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.heightValue = pval.Height;
					userdataObj.bottomRadius = pval.Radius;

					var rValue = showModalDialog("html/userdata/3DEdit.html", userdataObj, "dialogWidth=305px;dialogHeight=600px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGUID();
					userdataObj.guid = guid;
					var elementCylinder = earth.Factory.CreateElementCylinder(guid, userdataObj.name);
					elementCylinder.BeginUpdate();
					elementCylinder.Selectable = userdataObj.selectable;
					elementCylinder.Editable = userdataObj.editable;
					elementCylinder.Underground = userdataObj.objectFlagType;
					elementCylinder.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					elementCylinder.Radius = userdataObj.bottomRadius;
					elementCylinder.Height = userdataObj.heightValue;
					elementCylinder.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					var materialStyles = elementCylinder.MaterialStyles;
					var count = materialStyles.Count;
					for(var i = 0; i < count; i++) {
						var materialStyle = materialStyles.Items(i);
						materialStyle.DiffuseTexture = userdataObj.texturePath[i];
					}
					elementCylinder.EndUpdate();
					earth.AttachObject(elementCylinder);
					createElement(userdataObj, elementCylinder);
					updateTree(userdataObj);
					userdataArr.push(elementCylinder);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}

			};
			earth.ShapeCreator.CreateCylinder(16711680);
		} else if(flag == "createcone") { //创建圆锥
			polyCount = 3;
			userdataObj.type = 204;
			userdataObj.name = "cone";
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					var guid = earth.Factory.CreateGUID();
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.heightValue = pval.Height;
					userdataObj.bottomRadius = pval.BottomRadius;
					userdataObj.topRadius = pval.TopRadius;
					var rValue = showModalDialog("html/userdata/3DEdit.html", userdataObj, "dialogWidth=305px;dialogHeight=640px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					userdataObj.guid = guid;
					var elementCone = earth.Factory.CreateElementCone(guid, userdataObj.name);
					elementCone.BeginUpdate();
					elementCone.Selectable = userdataObj.selectable;
					elementCone.Editable = userdataObj.editable;
					elementCone.Underground = userdataObj.objectFlagType;
					elementCone.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					elementCone.BottomRadius = userdataObj.bottomRadius;
					elementCone.TopRadius = userdataObj.topRadius;
					elementCone.Height = userdataObj.heightValue;
					elementCone.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					var materialStyles = elementCone.MaterialStyles;
					var count = materialStyles.Count;
					for(var i = 0; i < count; i++) {
						var materialStyle = materialStyles.Items(i);
						materialStyle.DiffuseTexture = userdataObj.texturePath[i];
					}
					elementCone.EndUpdate();
					earth.AttachObject(elementCone);
					createElement(userdataObj, elementCone);
					treePIDObject[guid] = 0;
					updateTree(userdataObj);

					userdataArr.push(elementCone);
					earth.ShapeCreator.Clear();
				}

			};
			earth.ShapeCreator.CreateCone(16711680);
		} else if(flag == "createprism") { //创建棱柱
			userdataObj.type = 205;
			userdataObj.name = "prism";
			userdataObj.sides = 5;
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					var guid = earth.Factory.CreateGUID();
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.heightValue = pval.Height;
					userdataObj.bottomRadius = pval.Radius;
					var rValue = showModalDialog("html/userdata/3DEdit.html", userdataObj, "dialogWidth=305px;dialogHeight=640px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					userdataObj.guid = guid;
					var elementPrism = earth.Factory.CreateElementPrism(guid, userdataObj.name);
					elementPrism.BeginUpdate();
					elementPrism.Selectable = userdataObj.selectable;
					elementPrism.Editable = userdataObj.editable;
					elementPrism.Underground = userdataObj.objectFlagType;
					elementPrism.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					elementPrism.Sides = pval.Sides;
					elementPrism.Radius = userdataObj.bottomRadius;
					elementPrism.Height = userdataObj.heightValue;
					elementPrism.Sides = userdataObj.sides;
					elementPrism.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					var materialStyles = elementPrism.MaterialStyles;
					var count = materialStyles.Count;
					for(var i = 0; i < count; i++) {
						var materialStyle = materialStyles.Items(i);
						materialStyle.DiffuseTexture = userdataObj.texturePath[i];
					}

					elementPrism.EndUpdate();
					earth.AttachObject(elementPrism);
					createElement(userdataObj, elementPrism);
					updateTree(userdataObj);
					userdataArr.push(elementPrism);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}

			};
			earth.ShapeCreator.CreatePrism(userdataObj.sides, 16711680);
		} else if(flag == "createpyramid") { //创建棱椎
			userdataObj.type = 206;
			userdataObj.name = "pyramid";
			userdataObj.sides = 5;
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval) {
					userdataObj.path = earth.Environment.RootPath;
					userdataObj.heightValue = pval.Height;
					userdataObj.bottomRadius = pval.BottomRadius;
					userdataObj.topRadius = pval.TopRadius;
					var rValue = showModalDialog("html/userdata/3DEdit.html", userdataObj, "dialogWidth=305px;dialogHeight=680px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGUID();
					userdataObj.guid = guid;
					var elementPyramid = earth.Factory.CreateElementPyramid(guid, userdataObj.name);
					elementPyramid.BeginUpdate();
					elementPyramid.Selectable = userdataObj.selectable;
					elementPyramid.Editable = userdataObj.editable;
					elementPyramid.Underground = userdataObj.objectFlagType;
					elementPyramid.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
					elementPyramid.Sides = pval.Sides;
					elementPyramid.BottomRadius = userdataObj.bottomRadius;
					elementPyramid.TopRadius = userdataObj.topRadius;
					elementPyramid.Height = userdataObj.heightValue;
					elementPyramid.Sides = userdataObj.sides;
					elementPyramid.FillColor = parseInt("0x" + userdataObj.fillcolor.toString().substring(1).toLowerCase());
					var materialStyles = elementPyramid.MaterialStyles;
					var count = materialStyles.Count;
					for(var i = 0; i < count; i++) {
						var materialStyle = materialStyles.Items(i);
						materialStyle.DiffuseTexture = userdataObj.texturePath[i];
					}
					elementPyramid.EndUpdate();
					earth.AttachObject(elementPyramid);
					createElement(userdataObj, elementPyramid);
					updateTree(userdataObj);
					userdataArr.push(elementPyramid);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}

			};
			earth.ShapeCreator.CreatePyramid(userdataObj.sides, 16711680);
		} else if(flag == "createcordon") { //警戒线
			userdataObj.name = "cordon";
			userdataObj.type = "cordon";
			earth.Event.OnCreateGeometry = function(pval, type) {
				var count = pval.Count;
				var lineGuid = earth.Factory.CreateGuid();
				var elementPyramid = earth.Factory.CreateElementLine(lineGuid, userdataObj.name);
				elementPyramid.BeginUpdate();
				elementPyramid.SetPointArray(pval);
				elementPyramid.LineStyle.LineWidth = 1;
				elementPyramid.Visibility = true;
				elementPyramid.EndUpdate();
				var param = showModalDialog("html/userdata/cordon.html", userdataObj, "dialogWidth=305px;dialogHeight=440px;status=no");
				earth.ShapeCreator.Clear();
				if(!param) return;
				var texture = param.texture,
					columradius = param.radius,
					columHeight = param.columHeight,
					bannerHeight = param.bannerHeight,
					bannerWidth = param.bannerWidth,
					texture2 = param.texture2,
					path = earth.RootPath + 'userdata\\' + elementPyramid.Guid + '.usb';
				selectable = param.selectable;
				editable = param.editable;

				var v3 = elementPyramid.Generate_GuardLine_Mesh(texture, texture2, path, columradius, columHeight, bannerHeight, bannerWidth);
				userdataObj.path = earth.Environment.RootPath;
				var guid = earth.Factory.CreateGuid();
				texture = texture.split("\\");
				texture = texture[texture.length - 1];
				texture2 = texture2.split("\\");
				texture2 = texture2[texture2.length - 1];
				userdataObj.guid = guid;
				userdataObj.longitude = v3.X;
				userdataObj.latitude = v3.Y;
				userdataObj.altitude = v3.Z;
				userdataObj.pathUsb = earth.RootPath + 'userdata\\' + elementPyramid.Guid + '.usb';
				userdataObj.pointArray = pval;
				userdataObj.texture = userdataObj.path + texture;
				userdataObj.texture2 = userdataObj.path + texture2;

				var model = earth.Factory.CreateEditModelByLocal(userdataObj.guid, 'cordon', path, 1);
				model.SphericalTransform.SetLocationEx(v3.X, v3.Y, v3.Z);

				model.name = "cordon";
				model.Selectable = selectable;
				model.Editable = editable;
				earth.AttachObject(model);

				createElement(userdataObj, model);
				updateTree(userdataObj);
				userdataArr.push(model);
				earth.ShapeCreator.Clear();

			};
			earth.ShapeCreator.CreatePolyline(1, 0xffff0000);
		} else if(flag == "createdWater") {
			earth.Event.OnCreateGeometry = function(pval, type) {
				if(pval.Count) {
					if(pval.Count < 3) {
						alert("至少绘制3个点");
						earth.ShapeCreator.Clear();
						return;
					}
					userdataObj.type = "dWater";
					userdataObj.name = "dWater";
					var particleType = "dWater";
					userdataObj.path = earth.Environment.RootPath;
					var rValue = showModalDialog("html/userdata/getParticleName.html", userdataObj, "dialogWidth=240px;dialogHeight=105px;status=no");
					if(userdataObj.click == undefined || userdataObj.click == "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGUID();
					userdataObj.guid = guid;
					var elementWater = earth.Factory.CreateElementWater(guid, userdataObj.name);
					elementWater.BeginUpdate();
					var polygon = earth.Factory.CreatePolygon();
					polygon.AddRing(pval);
					elementWater.SetPolygon(polygon);
					elementWater.EndUpdate();
					earth.AttachObject(elementWater);

					createElement(userdataObj, elementWater);
					userdataArr.push(elementWater);
					updateTree(userdataObj);
					treePIDObject[guid] = 0;
					earth.ShapeCreator.Clear();
				}
			};
			earth.ShapeCreator.CreatePolygon();
		}
	};
	/**
	 * 隐藏风场
	 */
	var hideWindScene = function() {
		if(queryHtmlBalloon) {
			queryHtmlBalloon.DestroyObject();
			queryHtmlBalloon = null;
		}
		if(deltemp != null) {
			deleteFromEarth(deltemp);
		}
	}
	/**
	 * 显示风场
	 * @param {Object} boxpos box位置
	 * @param {Object} winddata 风场数据
	 */
	var showwindscene = function(boxpos, winddata) {
		//控制是否让所有数据气泡显示
		if(queryHtmlBalloon) {
			queryHtmlBalloon.DestroyObject();
			queryHtmlBalloon = null;
		}
		var centerX = boxpos.x;
		var centerY = boxpos.y;
		var centerZ = boxpos.z;
		var showLineHtml = '';
		var guid = earth.Factory.CreateGuid();
		var ba = 0xcc;
		var showLineHtml = '';
		var guid = earth.Factory.CreateGuid();
		queryHtmlBalloon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
		if(SYSTEMPARAMS.balloonAlpha && !isNaN(SYSTEMPARAMS.balloonAlpha)) {
			ba = 0;
		}
		if(ba == 0) {
			showLineHtml = '<div style="overflow:auto;width:245px;height:245px;text-align:center;">' +
				'<table border="0" cellpadding="3" cellspacing="1" align="center" width="100%"' +
				' style="font-size:16px;background-color:#b9d8f3;">';
			for(var i = 0; i < winddata.length; i++) {
				if(i % 2 == 0) {
					showLineHtml += '<tr style="background-color:#f4faff;">';
					showLineHtml += '<td  class="font" >' + winddata[i] + ':</td>';
					showLineHtml += '<td class="font" >' + winddata[i + 1] + '</td>';
					showLineHtml += '</tr>';
				}
			}
			showLineHtml += '</table></div>';

			queryHtmlBalloon.SetRectSize(330, 340);
			queryHtmlBalloon.SetIsTransparence(false);
		} else {
			showLineHtml = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:300px;height:300px;margin-top:25px;margin-bottom:25px;overflow:auto;">' +
				'<table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
			for(var i = 0; i < winddata.length; i++) {
				if(i % 2 == 0) {
					showLineHtml = showLineHtml + '<tr>';
					showLineHtml = showLineHtml + '<td  class="font" >' + winddata[i] + ':</td>';
					showLineHtml = showLineHtml + '<td class="font" >' + winddata[i + 1] + '</td>';
					showLineHtml = showLineHtml + '</tr>';
				}
			}
			showLineHtml = showLineHtml + '</table></div>';
			queryHtmlBalloon.SetRectSize(330, 340);
			queryHtmlBalloon.SetIsTransparence(true);
			queryHtmlBalloon.SetBackgroundAlpha(ba);
		}
		queryHtmlBalloon.SetSphericalLocation(centerX, centerY, centerZ);
		queryHtmlBalloon.SetTailColor(0xffffff00);
		queryHtmlBalloon.SetIsAddCloseButton(true);
		queryHtmlBalloon.SetIsAddMargin(true);
		queryHtmlBalloon.SetIsAddBackgroundImage(true);
		queryHtmlBalloon.ShowHtml(showLineHtml);
		earth.Event.OnHtmlBalloonFinished = function() {
			//删除立方体
			deleteFromEarth(deltemp);
			if(queryHtmlBalloon != null) {
				queryHtmlBalloon.DestroyObject();
				queryHtmlBalloon = null;
				earth.Event.OnHtmlBalloonFinished = function() {};
			}
		}
	}

	/**
	 * 创建军标
	 * 根据flag判断创建那种军标
	 * sArrow customArrow tailArrow customTailArrow equalSArrow doubleArrow xArrow
	 * assemblyArea triangleFlag rectFlag curveFlag
	 */
	var _createMilitaryTag = function(flag, userdataTree) {
		var obj = {};
		obj.action = "add";
		obj.earth = earth;
		obj.name = flag;
		earth.Event.OnCreateGeometry = function(pval, type) {
			if(pval.Count) {
				var sarrow;
				var guid = earth.Factory.CreateGuid();
				if(flag == "sArrow") {
					sarrow = earth.Factory.CreateElementPlotSArrow(guid, obj.name);
					obj.type = "250";
				} else if(flag == "customArrow") {
					sarrow = earth.Factory.CreateElementPlotCustomArrow(guid, obj.name);
					obj.type = "253";
				} else if(flag == "tailSArrow") {
					sarrow = earth.Factory.CreateElementPlotTailSArrow(guid, obj.name);
					obj.type = "252";
				} else if(flag == "customTailArrow") {
					sarrow = earth.Factory.CreateElementPlotCustomTailArrow(guid, obj.name);
					obj.type = "254";
				} else if(flag == "equalSArrow") {
					sarrow = earth.Factory.CreateElementPlotEqualSArrow(guid, obj.name);
					obj.type = "251";
				} else if(flag == "doubleArrow") {
					sarrow = earth.Factory.CreateElementPlotDoubleArrow(guid, obj.name);
					obj.type = "255";
				} else if(flag == "xArrow") {
					sarrow = earth.Factory.CreateElementPlotXArrow(guid, obj.name);
					obj.type = "256";
				} else if(flag == "assemblyArea") {
					sarrow = earth.Factory.CreateElementPlotAssemblyArea(guid, obj.name);
					obj.type = "260";
				} else if(flag == "triangleFlag") {
					sarrow = earth.Factory.CreateElementPlotTriangleFlag(guid, obj.name);
					obj.type = "257";
				} else if(flag == "rightAngleFlag") {
					sarrow = earth.Factory.CreateElementPlotRectFlag(guid, obj.name);
					obj.type = "258";
				} else if(flag == "curveFlag") {
					sarrow = earth.Factory.CreateElementPlotCurveFlag(guid, obj.name);
					obj.type = "259";
				}

				var militaryData;
				if(obj.type === "250" || obj.type === "251" || obj.type === "252" || obj.type === "253" || obj.type === "254" || obj.type === "255" || obj.type === "256" || obj.type === "260") {
					militaryData = window.showModalDialog("html/userdata/MilitaryTagData.html", obj, "dialogWidth=295px;dialogHeight=552px;status=no");
				} else {
					militaryData = window.showModalDialog("html/userdata/MilitaryTagData.html", obj, "dialogWidth=295px;dialogHeight=385px;status=no");
				}

				if(obj.click === "false") {
					earth.ShapeCreator.Clear();
					return;
				}

				obj.guid = sarrow.Guid;
				sarrow.BeginUpdate();
				sarrow.name = obj.name;
				sarrow.SetControlPointArray(pval);
				var linestyle = sarrow.LineStyle;
				linestyle.LineWidth = obj.linewidth;
				if(obj.linecolor) {
					linestyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
				}
				var fillstyle = sarrow.FillStyle;
				if(obj.fillcolor) {
					fillstyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				}
				//新增属性[DrawOrder, Selectable, Editable]
				sarrow.selectable = obj.selectable;
				sarrow.editable = obj.editable;

				if(flag != "triangleFlag" && flag != "rightAngleFlag" && flag != "curveFlag") {
					sarrow.AltitudeType = obj.Shadow;
				}

				sarrow.EndUpdate();
				earth.AttachObject(sarrow);
				createElement(obj, sarrow);
				updateTree(obj);
				userdataArr.push(sarrow);
				treePIDObject[guid] = 0;
				earth.ShapeCreator.Clear();
			}

		}

	};

	/**
	 * 创建标记
	 * @param {Object} flag
	 */
	var _createSignalSphere = function(flag) {
		var obj = {};
		obj.action = "add";
		obj.earth = earth;
		obj.name = flag;
		earth.Event.OnCreateGeometry = function(pt) {
			var param = window.showModalDialog("html/userdata/signalsphere.html", obj, "dialogWidth=284px;dialogHeight=350px;status=no");
			if(!param) return;
			var radius = Number(param.radius),
				segment = Number(param.segment),
				color = param.linecolor,
				desc = param.desc;
			var guid = earth.Factory.CreateGuid();
			var sphere = earth.Factory.CreateSignalSphere(guid, obj.name);
			sphere.BeginUpdate();
			sphere.SphericalTransform.SetLocationEx(pt.Longitude, pt.Latitude, pt.Altitude);
			sphere.Radius = radius;
			sphere.Segment = segment;
			sphere.LineStyle.LineColor = parseInt("0x" + color.substring(1).toLowerCase());
			sphere.EndUpdate();
			earth.AttachObject(sphere);

			obj.guid = guid;
			obj.type = 210;
			createElement(obj, sphere);
			updateTree(obj);
			userdataArr.push(sphere);
			treePIDObject[guid] = 0;
			earth.ShapeCreator.Clear();
		};
	};

	/**
	 * 导入模型数据
	 * 根据flag判断导入那种数据
	 */
	var _importModelData = function(flag, userdataTree) {
		var obj = {};
		obj.action = "add";
		obj.earth = earth;
		earth.ShapeCreator.Clear();
		if(flag === "model" || flag === "tree" || flag === "furniture") {
			earth.Event.OnCreateGeometry = function(pVal) {
				if(pVal) {
					obj.path = earth.Environment.RootPath;
					obj.flag = flag;
					var tag = 1;
					if(flag === "model") {
						obj.name = "模型";
						tag = 1;
					} else if(flag === "tree") {
						obj.name = "树";
						tag = 2;
					} else if(flag === "furniture") {
						obj.name = "小品";
						tag = 3;
					}
					obj.tag = tag;
					var rValue = showModalDialog("html/userdata/modelData.html", obj, "dialogWidth=283px;dialogHeight=218px;status=no");
					if(obj.click === "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGuid();
					obj.guid = guid;
					obj.type = 223;
					obj.longitude = pVal.Longitude;
					obj.latitude = pVal.Latitude;
					obj.altitude = pVal.Altitude;

					var model = earth.Factory.CreateEditModelByLocal(obj.guid, obj.name, obj.link, tag);
					model.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
					model.name = obj.name;
					model.Selectable = true;
					model.Editable = true;
					earth.AttachObject(model);
					userdataArr.push(model);
					createElement(obj, model);
					updateTree(obj);
					treePIDObject[guid] = 0;
				}
			}
			earth.ShapeCreator.CreatePoint();
		} else if(flag == "picture") {
			earth.Event.OnCreateGeometry = function(pVal) {
				if(pVal) {
					obj.path = earth.Environment.RootPath;
					var rValue = showModalDialog("html/userdata/pictureData.html", obj, "dialogWidth=280px;dialogHeight=300px;status=no");
					if(obj.click === "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					var guid = earth.Factory.CreateGuid();
					obj.guid = guid;
					obj.type = 217;
					obj.longitude = pVal.Longitude;
					obj.latitude = pVal.Latitude;
					obj.altitude = pVal.Altitude;
					obj.image = obj.iconFileName;

					var billboard = earth.Factory.CreateElementSimpleBillboard(obj.guid, obj.name);
					billboard.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
					billboard.BeginUpdate();
					billboard.name = obj.name;
					billboard.Width = obj.width;
					billboard.Height = obj.height;
					billboard.Image = obj.image;
					billboard.Visibility = true;
					billboard.EndUpdate();
					earth.AttachObject(billboard);
					userdataArr.push(billboard);
					createElement(obj, billboard);
					updateTree(obj);
					treePIDObject[obj.guid] = 0;
				}
			}
			earth.ShapeCreator.CreatePoint();
		} else if(flag == "simplebuilding") {
			earth.Event.OnCreateGeometry = function(pVal, type) {
				if(pVal) {
					obj.path = earth.Environment.RootPath;
					obj.floorsAllHeight = pVal.Height;
					obj.earth = earth;
					var rValue = showModalDialog("html/userdata/SimpleBuiliding.html", obj, "dialogWidth=345px;dialogHeight=490px;status=no");
					if(obj.click === "false") {
						earth.ShapeCreator.Clear();
						return;
					}
					obj.guid = earth.Factory.CreateGUID();
					obj.type = 280;
					obj.vector3s = pVal.Vector3s;
					obj.longitude = pVal.Longitude;
					obj.latitude = pVal.Latitude;
					obj.altitude = pVal.Altitude;

					var simpleBuilding = earth.factory.CreateSimpleBuilding(obj.guid, obj.name);
					simpleBuilding.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
					simpleBuilding.BeginUpdate();
					var polygon = earth.factory.CreatePolygon();
					polygon.AddRing(obj.vector3s);
					simpleBuilding.SetPolygon(0, polygon);
					var floorCount = parseInt(obj.floorCount);
					var floorHeight = parseFloat(obj.floorHeight);
					simpleBuilding.SetFloorsHeight(floorHeight * floorCount);
					simpleBuilding.SetFloorHeight(floorHeight);
					simpleBuilding.SetRoofType(obj.roofTypeNode);
					var roofcolor = parseInt("0x" + obj.roofColor.toString().substring(1).toLowerCase());
					var floorcolor = parseInt("0x" + obj.floorColor.toString().substring(1).toLowerCase());
					simpleBuilding.FloorsColor = floorcolor;
					simpleBuilding.RoofColor = roofcolor;

					var floorMats = simpleBuilding.GetFloorsMaterialStyles();
					floorMats.Items(0).DiffuseTexture = obj.roofTexture;
					floorMats.Items(1).DiffuseTexture = obj.roofTexture;
					for(var i = 2; i < floorMats.Count; i++) {
						floorMats.Items(i).DiffuseTexture = obj.floorTexture;
					}
					var roofMats = simpleBuilding.GetRoofMaterialStyles();
					for(var i = 0; i < roofMats.Count; i++) {
						roofMats.Items(i).DiffuseTexture = obj.roofTexture;
					}

					simpleBuilding.EndUpdate();
					earth.ShapeCreator.Clear();
					earth.AttachObject(simpleBuilding);
					userdataArr.push(simpleBuilding);
					createElement(obj, simpleBuilding);
					updateTree(obj);
					treePIDObject[obj.guid] = 0;
				}
			};
			earth.ShapeCreator.CreateVolume(0xffff0000);

		}

	};

	/**
	 * 创建图元保存到xml
	 */
	var createElement = function(obj, element, editMsg) {
		var rootxml = getUserdata(filename);
		var elementXML = getElementByGUID(rootxml, obj.guid);
		if(elementXML) {
			obj.desc = elementXML.getElementsByTagName("Description")[0].text;
		}
		var xmlData = createElementXml(obj, element);
		var xmlDoc = loadXMLStr("<xml>" + xmlData + "</xml>");

		var lookupNode = null;

		if(editMsg && !(editMsg["prev"] === undefined && editMsg["next"] === undefined)) {
			var prevNodeID = editMsg["prev"];
			var nextNodeID = editMsg["next"];
			if(prevNodeID) {
				var prevN = getElementByGUID(rootxml, prevNodeID);
				insertAfter(xmlDoc.documentElement.firstChild, prevN);
			} else if(nextNodeID) {
				var nextN = getElementByGUID(rootxml, nextNodeID);
				nextN.parentNode.insertBefore(xmlDoc.documentElement.firstChild, nextN);
			}
		} else {

			if(rootxml.childNodes.length > 1) {
				lookupNode = rootxml.childNodes[rootxml.childNodes.length - 1].firstChild;
			} else {
				lookupNode = rootxml.documentElement.firstChild;
			}
			lookupNode.appendChild(xmlDoc.documentElement.firstChild);
		}
		var root = earth.Environment.RootPath + "userdata\\" + filename;
		earth.UserDocument.saveXmlFile(root, rootxml.xml);

	}
	var substrDesc;
	/**
	 * 检查最新
	 */
	var checkLast = function() {
		var objLen = substrDesc.length;
		var charIndex = objLen - 2;
		var lastFourChar = substrDesc.substr(charIndex, 2);
		if(lastFourChar == "\r\n") {
			substrDesc = substrDesc.substr(0, charIndex);
			checkLast(substrDesc);
		}
	}

	/**
	 * 创建xml
	 *
	 */
	var createElementXml = function(obj, elment) {
		var xmlData = "";
		xmlData += "<Element id='" + obj.guid + "' name='" + obj.name + "' shadow_cast='1' type='" + obj.type + "' checked='1' >";
		xmlData += " <Visibility>true</Visibility>";
		if(obj.desc != undefined) {
			substrDesc = obj.desc;
			checkLast();
			obj.desc = substrDesc
			xmlData += " <Description>" + obj.desc + "</Description>";
		} else {
			xmlData += " <Description></Description>";
		}
		xmlData += " <RenderStyle>";

		//对警戒线需要单独存储
		if(obj.type === "cordon") {
			xmlData += "<ObjPathUsb>" + obj.pathUsb + "</ObjPathUsb>";
			xmlData += "<Texture>" + obj.texture + "</Texture>";
			xmlData += "<Texture2>" + obj.texture2 + "</Texture2>";
			xmlData += "<ColumRadius>" + obj.columradius + "</ColumRadius>";
			xmlData += "<ColumHeight>" + obj.columHeight + "</ColumHeight>";
			xmlData += "<BannerWidth>" + obj.bannerWidth + "</BannerWidth>";
			xmlData += "<BannerHeight>" + obj.bannerHeight + "</BannerHeight>";
		}

		//这里要针对动态对象单独处理 不用转类型
		if(!(obj.type === "fire" || obj.type === "dWater" || obj.type === "mist" || obj.type === "fountain" || obj.type === "nozzle" || obj.type === "SprayNozzle" || obj.type === "cordon" || obj.type === "Explosion" || obj.type === "WaterGunSmall")) {
			obj.type = Number(obj.type);
		}

		if(obj.type === "dWater") {
			var vector3s = "";
			vector3s = elment.GetExteriorRing();
			var ptString = "";
			for(var i = 0; i < vector3s.Count; i++) {
				ptString += " " + vector3s.Items(i).x + "," + vector3s.Items(i).y + "," + vector3s.Items(i).z;
			}
			xmlData += " <Coordinates>" + ptString + "</Coordinates>";
		}

		if(obj.type == "cordon") {
			var vector3s = obj.pointArray;
			var ptString = "";
			for(var i = 0; i < vector3s.Count; i++) {
				ptString += " " + vector3s.Items(i).x + "," + vector3s.Items(i).y + "," + vector3s.Items(i).z;
			}
			xmlData += " <Coordinates>" + ptString + "</Coordinates>";
		}

		//二维xml格式
		if(obj.type === 220 || obj.type === 227 || obj.type === 243 || obj.type === 228 || obj.type === 229 || obj.type === 211 || obj.type === 245) {
			var lineColor = elment.LineStyle.LineColor;
			xmlData += "  <LineColor>" + obj.linecolor + "</LineColor>";
			xmlData += "  <LineWidth>" + elment.LineStyle.LineWidth + "</LineWidth>";
			if(elment.FillStyle) {
				xmlData += "  <FillColor>" + obj.fillcolor + "</FillColor>";
			}

			var lineColor = elment.LineStyle.LineColor;
			xmlData += "<LineColor>" + obj.linecolor + "</LineColor>";
			xmlData += "  <ShadowStyle>";
			xmlData += "   <ShadowType>" + obj.shadow + "</ShadowType>";
			xmlData += "   <ShadowColor>" + obj.linecolor + "</ShadowColor>";
			//贴地模式记录
			if(obj.type == 220 || obj.type == 211 || obj.type == 245) {
				xmlData += "   <ClampAltitudes>";
				var altStr = '';
				if(obj.shadow.toString() === "1") {
					var altitudes = elment.GetClampAltitude();
					if(altitudes != null && altitudes.Count > 0) {
						for(var m = 0; m < altitudes.Count; m++) {
							var alt = altitudes.GetAt(m);
							if(altStr != '') {
								altStr += ',';
							}
							altStr += alt;
						}
					}
				}
				xmlData += altStr + '</ClampAltitudes>';
			}
			xmlData += "  </ShadowStyle>";

			xmlData += "  <Selectable>" + obj.selectable + "</Selectable>";
			xmlData += "  <Editable>" + obj.editable + "</Editable>";

			//由于圆 椭圆与扇形还没有DrawOrder属性 因此这里暂不添加
			if(obj.type === 220 || obj.type === 211 || obj.type === 229 || obj.type === 228 || obj.type === 243) {
				xmlData += " <DrawOrder>" + obj.drawOrder + "</DrawOrder>";
			}
			var vector3s = "";
			if(obj.type === 220) {
				xmlData += "  <isShadowArrow>" + obj.arrow + "</isShadowArrow>";
				xmlData += "  <Length>" + obj.lineLength + "</Length>";
				vector3s = elment.GetPointArray();
			} else if(obj.type === 211) {
				vector3s = elment.GetExteriorRing();
			} else if(obj.type === 227) {
				vector3s = "";
				xmlData += "   <Radius>" + elment.Radius + "</Radius>";
			} else if(obj.type === 229) {
				xmlData += "   <isShadowArrow>" + obj.arrow + "</isShadowArrow>";
				vector3s = elment.GetControlPointArray();
			} else if(obj.type === 228) {
				vector3s = "";
				var ArcCenterStr = " " + elment.ArcCenter.x + "," + elment.ArcCenter.y + "," + elment.ArcCenter.z;
				xmlData += "   <ArcCenter>" + ArcCenterStr + "</ArcCenter>";
				xmlData += "   <Angle>" + elment.Angle + "</Angle>";
				xmlData += "   <Radius>" + obj.radius + "</Radius>";
			} else if(obj.type === 243) {
				vector3s = "";
				xmlData += "   <LongRadius>" + elment.LongRadius + "</LongRadius>";
				xmlData += "   <ShortRadius>" + elment.ShortRadius + "</ShortRadius>";
			} else if(obj.type === 245) {
				vector3s = elment.GetExteriorRing();
				xmlData += "   <TextureImagePath>" + obj.picture + "</TextureImagePath>";
				xmlData += "   <TextureTiltX>" + obj.expandX + "</TextureTiltX>";
				xmlData += "   <TextureTiltY>" + obj.expandY + "</TextureTiltY>";
				xmlData += "   <TextureMode>" + obj.textture + "</TextureMode>";
			}

			//新增接口 obj.type==="texturePolygon" || obj.type==="rectangle" 这两者不支持周长与面积
			if(obj.type === 211 || obj.type === 227 || obj.type === 228 || obj.type === 243) {
				xmlData += "  <Perimeter>" + elment.perimeter + "</Perimeter>";
				xmlData += "  <Area>" + Math.abs(elment.area) + "</Area>";
			}

			var ptString = "";
			for(var i = 0; i < vector3s.Count; i++) {
				ptString += " " + vector3s.Items(i).x + "," + vector3s.Items(i).y + "," + vector3s.Items(i).z;
			}
			xmlData += " <Coordinates>" + ptString + "</Coordinates>";
		}

		xmlData += " </RenderStyle>";

		//军标xml
		if(obj.type == 250 || obj.type == 251 || obj.type == 252 || obj.type == 253 || obj.type == 254 || obj.type == 255 || obj.type == 256 || obj.type == 257 || obj.type == 258 || obj.type == 259 || obj.type == 260) {
			xmlData += "  <LineColor>" + obj.linecolor + "</LineColor>";
			xmlData += "  <LineWidth>" + elment.LineStyle.LineWidth + "</LineWidth>";
			xmlData += "  <FillColor>" + obj.fillcolor + "</FillColor>";
			xmlData += "   <Shadow>" + obj.Shadow + "</Shadow>";
			var vector3s = elment.GetControlPointArray();
			var ptString = "";
			for(var i = 0; i < vector3s.Count; i++) {
				ptString += " " + vector3s.Items(i).x + "," + vector3s.Items(i).y + "," + vector3s.Items(i).z;
			}
			xmlData += " <Coordinates>" + ptString + "</Coordinates>";

			//新增节点
			if(obj.type == 250 || obj.type == 251 || obj.type == 252 || obj.type == 253 || obj.type == 254 || obj.type == 255 || obj.type == 256 || obj.type == 260) {
				xmlData += " <DrawOrder>" + obj.drawOrder + "</DrawOrder>";
				xmlData += " <Selectable>" + obj.selectable + "</Selectable>";
				xmlData += " <Editable>" + obj.editable + "</Editable>";
			}
		}
		//信号辐射球
		if(obj.type == 210) {
			xmlData += "  <LineColor>" + obj.linecolor + "</LineColor>";
			xmlData += "  <Radius>" + obj.radius + "</Radius>";
			xmlData += "  <Segment>" + obj.segment + "</Segment>";
		}
		//三维对象
		if(obj.type === 216 || obj.type === 202 || obj.type === 207 || obj.type === 203 ||
			obj.type === 204 || obj.type === 205 || obj.type === 206) { //三维xml格式
			xmlData += "<TextureParams>";
			xmlData += "    <UniqueSideStyle>" + "" + "</UniqueSideStyle>";
			xmlData += "  <FillColor>" + obj.fillcolor + "</FillColor>";

			//新增属性
			xmlData += "  <Selectable>" + obj.selectable + "</Selectable>";
			xmlData += "  <Editable>" + obj.editable + "</Editable>";
			xmlData += "  <ObjectFlagType>" + obj.objectFlagType + "</ObjectFlagType>";

			var count = elment.MaterialStyles.Count;
			for(var i = 0; i < count; i++) {
				xmlData += "    <TextureParam>";
				xmlData += "        <TexturePath>" + obj.texturePath[i] + "</TexturePath>";
				xmlData += "    </TextureParam>";
			}
			xmlData += "</TextureParams>";
			xmlData += "  <SphericalTransform><Location>" + elment.SphericalTransform.Longitude + "," + elment.SphericalTransform.Latitude + "," + elment.SphericalTransform.Altitude + "</Location></SphericalTransform>";

			if(obj.type === 216) {
				xmlData += "   <Radius>" + elment.radius + "</Radius>";
				xmlData += "        <TexturePath>" + obj.texturePath[2] + "</TexturePath>";
			} else if(obj.type === 202) {
				xmlData += "  <Box><Width>" + elment.Width + "</Width>";
				xmlData += "  <Length>" + elment.Length + "</Length>";
				xmlData += "  <Height>" + elment.Height + "</Height></Box>";
			} else if(obj.type === 207) {
				var pList = "";
				var vector3s = elment.Vectors;
				for(var i = 0; i < vector3s.Count; i++) {
					var point = vector3s.Items(i);
					pList += point.X + "," + point.Y + "," + point.Z + " ";
				}
				xmlData += "  <Volume><PointList>" + pList + " </PointList>";
				xmlData += " <Height>" + obj.heightValue + "</Height></Volume>";
			} else if(obj.type === 203) { //圆柱
				xmlData += "  <Cylinder><Radius>" + obj.bottomRadius + "</Radius>";
				xmlData += "  <Height>" + obj.heightValue + "</Height></Cylinder>";
			} else if(obj.type === 204) { //圆锥
				xmlData += "  <Cone><Radius>" + obj.bottomRadius + "</Radius>";
				xmlData += "  <TopRadius>" + obj.topRadius + "</TopRadius>";
				xmlData += "  <Height>" + obj.heightValue + "</Height></Cone>";
			} else if(obj.type === 205) { //棱柱
				xmlData += "  <Prism><Sides>" + obj.sides + "</Sides>";
				xmlData += "  <Radius>" + obj.bottomRadius + "</Radius>";
				xmlData += "  <Height>" + obj.heightValue + "</Height></Prism>";
			} else if(obj.type === 206) { //棱锥
				xmlData += "  <Pyramid><Sides>" + obj.sides + "</Sides>";
				xmlData += "  <BottomRadius>" + obj.bottomRadius + "</BottomRadius>";
				xmlData += "  <TopRadius>" + obj.topRadius + "</TopRadius>";
				xmlData += "  <Height>" + obj.heightValue + "</Height></Pyramid>";
			}
		}
		if(obj.type === 223) { //model
			xmlData += " <EditModel>";
			xmlData += "  <Link>" + obj.link + "</Link>";
			xmlData += "  <Pivot>0.00000000,0.00000000,0.00000000</Pivot>";
			xmlData += "  <BBox>";
			xmlData += "   <MinBoundary>-10,0.0,-10</MinBoundary>";
			xmlData += "   <MaxBoundary>10,10,10</MaxBoundary>";
			if(obj.tag) {
				xmlData += "   <ObjectFlagType>" + obj.tag + "</ObjectFlagType>";
			}
			xmlData += "  </BBox>";
			xmlData += " </EditModel>";
		} else if(obj.type === 230) { //逃生路线
			xmlData += " <EditModel>";
			xmlData += "  <Link>" + obj.pathUsb + "</Link>";
			xmlData += "  <Pivot>0.00000000,0.00000000,0.00000000</Pivot>";
			xmlData += "  <BBox>";
			xmlData += "   <MinBoundary>-10,0.0,-10</MinBoundary>";
			xmlData += "   <MaxBoundary>10,10,10</MaxBoundary>";
			xmlData += "   <Tag>1</Tag>";
			xmlData += "  </BBox>";
			xmlData += " </EditModel>";
		} else if(obj.type === 217) { //picture
			xmlData += " <Width>" + obj.width + "</Width>";
			xmlData += " <Height>" + obj.height + "</Height>";
			xmlData += " <RenderStyle>";
			xmlData += "  <Icon>" + obj.iconFileName + "</Icon>";
			xmlData += " </RenderStyle>";
			xmlData += "<Location>" + obj.longitude + "," + obj.latitude + "," + obj.altitude + "</Location>";

		} else if(obj.type === 209) { //icon
			xmlData += " <RenderStyle type='normal'>";
			xmlData += "  <Icon>" + obj.iconNormalFileName + "</Icon>";
			xmlData += " </RenderStyle>";
			xmlData += " <RenderStyle type='selected'>";
			xmlData += "  <Icon>" + obj.iconSelectedFileName + "</Icon>";
			xmlData += " </RenderStyle>";
			xmlData += " <Location>" + obj.longitude + "," + obj.latitude + "," + obj.altitude + "</Location>";
			//新增属性
			xmlData += "  <TextFormat>" + obj.textFormat + "</TextFormat>";
			xmlData += "  <TextColor>" + obj.textColor + "</TextColor>";
			xmlData += "  <TextHorizontalScale>" + obj.textHorizontalScale + "</TextHorizontalScale>";
			xmlData += "  <TextVerticalScale>" + obj.textVerticalScale + "</TextVerticalScale>";
			xmlData += "  <ShowHandle>" + obj.showHandle + "</ShowHandle>";
			xmlData += "  <HandleHeight>" + obj.handleHeight + "</HandleHeight>";
			xmlData += "  <HandleColor>" + obj.handleColor + "</HandleColor>";
			xmlData += "  <MinVisibleRange>" + obj.minVisibleRange + "</MinVisibleRange>";
			xmlData += "  <MaxVisibleRange>" + obj.maxVisibleRange + "</MaxVisibleRange>";
			xmlData += "  <Selectable>" + obj.selectable + "</Selectable>";
			xmlData += "  <Editable>" + obj.editable + "</Editable>";

		} else if(obj.type === 280) {
			xmlData += " <FloorHeight>" + obj.floorHeight + "</FloorHeight>";
			xmlData += " <FloorCount>" + obj.floorCount + "</FloorCount>";
			xmlData += " <RoofType>" + obj.roofTypeNode + "</RoofType>";
			xmlData += " <FloorTexture>" + obj.floorTexture + "</FloorTexture>";
			xmlData += " <RoofTexture>" + obj.roofTexture + "</RoofTexture>";
			xmlData += " <RoofColor>" + obj.roofColor + "</RoofColor>";
			xmlData += " <FloorColor>" + obj.floorColor + "</FloorColor>";

			xmlData += " <Location>" + obj.longitude + "," + obj.latitude + "," + obj.altitude + "</Location>";
			var pList = "";
			var vector3s = elment.GetPolygon(0).GetRingAt(0);
			for(var i = 0; i < vector3s.Count; i++) {
				var point = vector3s.Items(i);
				pList += point.X + "," + point.Y + "," + point.Z + " ";
			}
			xmlData += "  <SimpleBuilding><PointList>" + pList + " </PointList></SimpleBuilding>";
		} else if(obj.type === 244) {
			xmlData += " <Height>" + obj.height + "</Height>";
			xmlData += " <Grid>";
			xmlData += "  <Link>" + obj.path + "</Link>";
			xmlData += " </Grid>";
		} else if(obj.type == "cordon") {
			//新增属性
			xmlData += "  <Selectable>" + obj.selectable + "</Selectable>";
			xmlData += "  <Editable>" + obj.editable + "</Editable>";
		}

		var Rotation = elment.SphericalTransform.GetRotation();
		var Scale = elment.SphericalTransform.GetScale();
		var Position = elment.SphericalTransform.GetLocation();

		xmlData += " <ControlParams>";
		xmlData += "    <Rotation>" + Rotation.X + "," + Rotation.Y + "," + Rotation.Z + "</Rotation>";
		xmlData += "    <Scale>" + Scale.X + "," + Scale.Y + "," + Scale.Z + "</Scale>";
		xmlData += "    <Position>" + Position.X + "," + Position.Y + "," + Position.Z + "</Position>";
		xmlData += " </ControlParams>";
		var heading = earth.GlobeObserver.Pose.heading;
		var tilt = earth.GlobeObserver.Pose.tilt;
		var range = earth.GlobeObserver.PickRange();

		xmlData += " <LookAt>";
		if(obj.name == "grid") {
			xmlData += "  <Longitude>" + obj.longitude + "</Longitude>";
			xmlData += "  <Latitude>" + obj.latitude + "</Latitude>";
			xmlData += "  <Altitude>" + obj.altitude + "</Altitude>";
		} else {
			xmlData += "  <Longitude>" + elment.SphericalTransform.Longitude + "</Longitude>";
			xmlData += "  <Latitude>" + elment.SphericalTransform.Latitude + "</Latitude>";
			xmlData += "  <Altitude>" + elment.SphericalTransform.Altitude + "</Altitude>";
		}
		xmlData += "  <Heading>" + heading + "</Heading>";
		xmlData += "  <Tilt>" + tilt + "</Tilt>";
		xmlData += "  <Range>" + range + "</Range>";
		xmlData += " </LookAt>";

		xmlData += "</Element>";

		return xmlData;
	};

	/**
	 * 选择
	 */
	var selObjNum = "";
	var selectSet = "";
	var _select = function() {
		earth.ToolManager.SphericalObjectEditTool.Select();
		earth.Event.OnSelectChanged = function() {

			selectSet = earth.SelectSet; //获取选择集
			selObjNum = selectSet.GetCount(); //获取数量
		}

	};
	/**
	 * 打包
	 */
	var _group = function() {
		var selectSet = earth.SelectSet;
		if(earth.SelectSet.GetCount() < 2) {
			alert("至少选择两个对象进行组合！");
		}
		selectSet.group();
	}
	/**
	 * 拆分
	 */
	var _ungroup = function() {
		var selectSet = earth.SelectSet;
		var count = selectSet.GetCount();
		if(count < 1) {
			alert("需要选择组合对象进行拆分！");
		}
		selectSet.ungroup();
	}
	/**
	 * 移动
	 */
	var _move = function() {
		earth.ToolManager.SphericalObjectEditTool.Move(7);
	};
	/**
	 * 旋转
	 */
	var _rotate = function() {
		earth.ToolManager.SphericalObjectEditTool.Rotate(7);
	};
	/**
	 * 缩放
	 */
	var _scale = function() {
		earth.ToolManager.SphericalObjectEditTool.Scale(7);
	};
	/**
	 * 清除加到球上的对象
	 */
	var clearObj = function(clearElementArr) {
		for(var i = 0; i < clearElementArr.length; i++) {
			_initDataArr(clearElementArr[i]);
			if(userdataArr != null) {
				for(var n = 0; n < userdataArr.length; n++) {
					earth.DetachObject(userdataArr[n]);
				}
			}
		}

	}

	/**
	 * 移动
	 * @param {Object} dx
	 * @param {Object} dy
	 * @param {Object} dz
	 */
	var _moveByValue = function(dx, dy, dz) {
		earth.ToolManager.SphericalObjectEditTool.MoveSelectObject(dx, dy, dz);
		dingliangEditFinish();
	};
	/**
	 * 旋转
	 * @param {Object} dx
	 * @param {Object} dy
	 * @param {Object} dz
	 */
	var _rotateByValue = function(dx, dy, dz) {
		earth.ToolManager.SphericalObjectEditTool.RotateSelectObject(dx, dy, dz);
		dingliangEditFinish();
	};
	/**
	 * 缩放
	 * @param {Object} dx
	 * @param {Object} dy
	 * @param {Object} dz
	 */
	var _scaleByValue = function(dx, dy, dz) {
		earth.ToolManager.SphericalObjectEditTool.ScaleSelectObject(dx, dy, dz);
		dingliangEditFinish();
	};
	/**
	 * 在进行编辑的时候需要禁用图层树的编辑按钮
	 * @param {Boolean} isDisable [description]
	 */
	var setRightDisable = function(isDisable) {
		try {
			if(top.getOperObject() && top.getOperObject().$("#userDataTree") && top.getOperObject().$("#userDataTree").length > 0) {
				top.getOperObject().setRightDisable(isDisable)
			}
		} catch(e) {

		}

	}
	/**
	 * 贴地
	 * 这里面的事件流有点乱...
	 */
	var _alignGround = function() {
		earth.ToolManager.SphericalObjectEditTool.AlignGround();
	};

	/**
	 * 编辑顶点
	 */
	var _editpoint = function() {
		saveTag = "save";
		setRightDisable(true);
		earth.ToolManager.ElementEditTool.ShapeEdit();
	};

	/**
	 * 添加顶点
	 */
	var _addpoint = function() {
		saveTag = "save";
		setRightDisable(true);
		earth.ToolManager.ElementEditTool.InsertPoint();
	};
	/**
	 * 删除顶点
	 */
	var _deletepoint = function() {
		saveTag = "save";
		earth.Event.OnGeometryDeletePoint = function(v1) {
			selectObj();
			earth.ToolManager.ElementEditTool.DeleteSelectedPoint(); //删除选择点
			setRightDisable(false);
		};
		earth.ToolManager.ElementEditTool.DeletePoint(); //选择删除点
	};
	/**
	 * 边拉伸
	 */
	var _SegmentExtrude = function() {
		setRightDisable(true);
		earth.ToolManager.ElementEditTool.SegmentExtrude();
	};
	/**
	 * 体拉伸
	 */
	var _VolumeSegmentExtrude = function() {
		setRightDisable(true);
		earth.ToolManager.ElementEditTool.VolumeSegmentExtrude();
	};
	/**
	 * 克隆
	 */
	var _clone = function() {
		selectSet = null;
		selObjNum = 0;
		//结束编辑状态
		earth.ToolManager.SphericalObjectEditTool.Browse();

		earth.ToolManager.SphericalObjectEditTool.Select();
		earth.Event.OnSelectChanged = function(x) {
			earth.Event.OnSelectChanged = function(x) {};
			var selectSet = earth.SelectSet;
			for(var i = 0; i < selectSet.GetCount(); i++) {
				var obj = selectSet.GetObject(i);
				if(obj.RtspURL) {
					alert("摄像机不能克隆！");
					selectSet.Clear()
					return;
				}
				var copyObject = obj.Clone();
				copyObject.Name = copyObject.Name.replace(/_/g, '');

				var rootxml = getUserdata(filename);
				var nodes = getElementFromGUID(rootxml, obj.Guid, "");
				var vector3s = "";
				var copyNode = nodes[0]["remove"].cloneNode(true);

				//坐标偏移处理
				var positionNode = copyNode.getElementsByTagName("Position")[0].text;
				var posNode = positionNode.split(",");
				var newX = Number(posNode[0]) + 0.0001;
				var newY = Number(posNode[1]) + 0.0001;
				var checkCloneObj = function() {
					for(var ii = 0; ii < userdataArr.length; ii++) {
						var oo = userdataArr[ii];
						if(Math.abs(newX - oo.SphericalTransform.Longitude) < 0.0001 && Math.abs(newY - oo.SphericalTransform.Latitude) < 0.0001) {
							newX += 0.0001;
							newY -= 0.0001;
							checkCloneObj();
							break;
						}
					}
				}
				checkCloneObj();
				var newPos = newX + "," + newY + "," + posNode[2];
				copyObject.SphericalTransform.SetLocationEx(newX, newY, Number(posNode[2]));
				copyObject.Visibility = true;
				// 暂时注释，规避Clone()问题
				/*if(obj.Radius&&obj.Segment){
					// 解决颜色不一致问题
					obj.LineStyle.LineColor = 1;
					// 在克隆【雷达基站】参数会默认为 radius=1;segment=9;color=#c0c0c0; 所以从xml中取出重新设置参数
					var radius = nodes[0]["remove"].getElementsByTagName("Radius")[0].text;
					var segment = nodes[0]["remove"].getElementsByTagName("Segment")[0].text;
					var color = nodes[0]["remove"].getElementsByTagName("LineColor")[0].text;

					copyObject.Radius = obj.Radius = radius;
					copyObject.Segment = obj.Segment = segment;
					copyObject.LineStyle.LineColor = obj.LineStyle.LineColor = parseInt("0x" + color.substring(1).toLowerCase());

				}*/
				copyObject.BeginUpdate();
				earth.AttachObject(copyObject);
				copyObject.EndUpdate();

				userdataArr.push(copyObject);
				treePIDObject[copyObject.Guid] = 0;

				nodes[0]["remove"].parentNode.appendChild(copyNode);
				var locationNode = copyNode.getElementsByTagName("Location");
				var CoordinatesNode = copyNode.getElementsByTagName("Coordinates");
				var Longitude = copyNode.getElementsByTagName("Longitude");
				var Latitude = copyNode.getElementsByTagName("Latitude");
				if(CoordinatesNode.length != 0) {
					if(obj.Rtti == 220) { //line
						vector3s = obj.GetPointArray();
					} else if(obj.Rtti == 211 || obj.Rtti == 245) { //polygon
						vector3s = obj.GetExteriorRing();
					} else if(obj.Rtti == 227 || obj.Rtti == 228 || obj.Rtti == 243) { //polygon
						vector3s = "";
					} else if(obj.Rtti == 229) {
						vector3s = obj.GetControlPointArray();
					} else if(obj.Rtti == 207) {
						vector3s = obj.Vectors;
					} else if(obj.Rtti == 280) {
						vector3s = obj.GetPolygon(0).GetRingAt(0);
					}
					var ptString = "";
					for(var j = 0; j < vector3s.Count; j++) {
						var vector3sX = Number(vector3s.Items(j).x) + 0.0001;
						var vector3sY = Number(vector3s.Items(j).Y) + 0.0001;
						ptString += " " + vector3sX + "," + vector3sY + "," + vector3s.Items(j).z;
					}
					copyNode.getElementsByTagName("Coordinates")[0].text = ptString;
				}
				if(locationNode.length != 0) {
					var str = copyObject.SphericalTransform.Longitude + "," + copyObject.SphericalTransform.Latitude + "," + copyObject.SphericalTransform.Altitude;
					copyNode.getElementsByTagName("Location")[0].text = str;
				}
				if(Longitude.length != 0) {
					copyNode.getElementsByTagName("Longitude")[0].text = copyObject.SphericalTransform.Longitude;
				}
				if(Latitude.length != 0) {
					copyNode.getElementsByTagName("Latitude")[0].text = copyObject.SphericalTransform.Latitude;
				}
				var elementDoc = copyNode.getElementsByTagName("Element");
				var updatanode = {
					guid: copyObject.Guid,
					name: copyNode.getAttribute("name") + "Clone"
				};
				updateTree(updatanode);
				copyNode.setAttribute("id", copyObject.Guid);
				copyNode.setAttribute("name", copyNode.getAttribute("name") + "Clone");

				copyNode.getElementsByTagName("Position")[0].text = newPos;

				var path = earth.Environment.RootPath + "userdata\\" + filename;
				earth.UserDocument.saveXmlFile(path, rootxml.xml);
			}
			selectSet.Clear();
			//结束编辑状态
			earth.ToolManager.SphericalObjectEditTool.Browse();
		}

	};
	/**
	 * 删除对象
	 * */
	var _delObj = function() {
		var obj = "";
		if(selObjNum <= 0 || selObjNum == "") {
			alert("请选择要删除的对象");
		} else {
			var r = confirm("确定删除选中的对象");
			if(r) {
				if(top.isUserdataTree) {
					var thisZTree = top.getOperObject().getUserdataTree();
				}
				var selectObjs = [];
				for(var i = 0; i < selObjNum; i++) {
					obj = selectSet.GetObject(i);
					selectObjs.push(obj);
				}
				for(var j = 0; j < selectObjs.length; j++) {
					var thisObj = selectObjs[j];
					var nodeId = thisObj.Guid;
					if(thisZTree) {
						var thisNode = thisZTree.getNodesByParam("id", thisObj.Guid)[0];
						thisZTree.removeNode(thisNode);
					}
					//根据id删除对应的element并同步到本地的xml文件
					_deleteUserNode(nodeId, filename);
					//清除earth上对应的要素 这里貌似不起作用啊 删除不了动态对象
					earth.ShapeCreator.Clear();
					deleteFromEarth(nodeId);
					//从对象数组中清除该对象
					removeFromUserdata(userdataArr, nodeId);
					//删除完成后，需要把选择集里面减少一个
					selObjNum--;
				}
			}
		}
	}
	/**
	 * 选择对象
	 */
	var selectObj = function() {

		var selectSet = earth.SelectSet;
		var count = selectSet.GetCount();
		if(count >= 2) {
			$('#group').removeAttr("disabled");
		} else {
			$('#group').attr("disabled", true);
		}
		
		for(var i = 0; i < selectSet.GetCount(); i++) {
			var element = selectSet.GetObject(i);
			if(!element.Aspect) { //判断是否摄像头
				if(editDataArr === undefined) {
					editDataArr = earth.editDataArr;
				}
				saveTag = "save";
				editDataArr.push(element);
			} else {
				if(cameraArr === undefined) {
					cameraArr = earth.cameraArr;
				}
				cameraArr.push(element);
			}
		}
	};
	$(document).ready(function() {
		editDataArr = [];
		earth.Event.OnPoseChanged = function(x, y, z) {
			selectObj();
		}
		earth.Event.OnControlPointSelectChanged = function(x) {
			selectObj();
		}
		earth.Event.OnControlPointValueChanged = function(x) {
			selectObj();
		}
		earth.Event.OnGeometryDeletePoint = function(x) {
			selectObj();
		}
		earth.Event.OnGeometryInsertPoint = function(x) {
			selectObj();
		}
		earth.Event.OnSelectChanged = function(x) {
			selectObj();
		}
		earth.Event.OnExtrudeEnd = function(){
			earth.Event.OnSelectChanged = function(){};
			editDataArr = [];
			var selectSet = earth.SelectSet;
			var count = selectSet.GetCount();
			for(var i = 0; i < count; i++){
				editDataArr.push(selectSet.GetObject(i));
			}
			if(editDataArr.length != 0) {
				_save();
			}
			earth.Event.OnSelectChanged = function(x) {
				selectObj();
			}
		}
		earth.Event.OnEditFinished = function() {
			setRightDisable(false);
			if(saveTag === "") {
				editDataArr = [];
			}
			if(editDataArr.length != 0) {
				_save();
			}
			if(cameraArr.length != 0) {
				_saveCamera();
			}

			//清空选择
			earth.ToolManager.SphericalObjectEditTool.Browse();
			var picturesBalloons = null;
			var pb = self.picturesBalloons || parent.picturesBalloons;
			if(pb === undefined) {
				picturesBalloons = earth.htmlBallon;
			} else {
				picturesBalloons = pb;
			}
			if(picturesBalloons != null) {
				picturesBalloons.DestroyObject();
				picturesBalloons = null;
			}
			if(saveTag === "save") {
				saveTag = "";
			}
		};
	});
	/**
	 * 编辑结束后处理
	 */
	var dingliangEditFinish = function() {
		editDataArr = [];
		selectObj();
		if(editDataArr.length != 0) {
			_save();
		}
		if(cameraArr.length != 0) {
			_saveCamera();
		}
	}
	/**
	 * 保存移动、旋转、缩放编后的camera
	 */
	var _saveCamera = function() {
		var xmlCameraData = earth.UserDocument.LoadXmlFile(earth.RootPath + STAMP_config.constants.CAMERAFILE + ".xml");
		var cameraDoc = loadXMLStr(xmlCameraData);
		var cameras = cameraDoc.getElementsByTagName("record");
		for(var m = 0; m < cameras.length; m++) {
			var id = cameras[m].getAttribute("ID");
			for(var i = 0; i < cameraArr.length; i++) {
				if(id === cameraArr[i].Guid) { //todo
					var Rotation = cameraArr[i].SphericalTransform.GetRotation();
					var Scale = cameraArr[i].SphericalTransform.GetScale();
					var Position = cameraArr[i].SphericalTransform.GetLocation();
					var lacation = Position.X + "," + Position.Y + "," + Position.Z;
					var rtt = Rotation.X + "," + Rotation.Y + "," + Rotation.Z;
					var scl = Scale.X + "," + Scale.Y + "," + Scale.Z;
					cameras[m].setAttribute("LOCATION", lacation);
					cameras[m].setAttribute("ROTATION", rtt);
					cameras[m].setAttribute("SCALE", scl);
				}
			}
		}
		var path = earth.RootPath + STAMP_config.constants.CAMERAFILE;
		earth.UserDocument.saveXmlFile(path, cameraDoc.xml);

	}
	/**
	 * 保存移动、旋转、顶点等编辑修改
	 */
	var saveTag = "";
	var _save = function() {
		//editDataArr包含当前选中对象
		var rootxml = getUserdata(filename);
		var objs = rootxml.getElementsByTagName("Element");
		for(var i = 0; i < editDataArr.length; i++) {
			var element = editDataArr[i];
			var obj = null;
			for(var m = 0; m < objs.length; m++) {
				var objitem = objs[m];
				var id = objitem.getAttribute("id");
				if(id == element.Guid) {
					var Rotation = element.SphericalTransform.GetRotation();
					var Scale = element.SphericalTransform.GetScale();
					var Position = element.SphericalTransform.GetLocation();
					var lacation = Position.X + "," + Position.Y + "," + Position.Z;
					var rtt = Rotation.X + "," + Rotation.Y + "," + Rotation.Z;
					var scl = Scale.X + "," + Scale.Y + "," + Scale.Z;
					var controlParams = objitem.getElementsByTagName("ControlParams");
					if(controlParams.length > 0) {
						var nodes = controlParams[0].childNodes;
						for(var j = 0; j < nodes.length; j++) {
							var nodeitem = nodes[j];
							if(nodeitem.tagName == "Rotation") {
								nodeitem.text = rtt;
							} else if(nodeitem.tagName == "Scale") {
								nodeitem.text = scl;
							} else if(nodeitem.tagName == "Position") {
								nodeitem.text = lacation;
							}
						}
					}
					var lookatParams = objitem.getElementsByTagName("LookAt");
					if(lookatParams.length > 0) {
						var nodes = lookatParams[0].childNodes;
						for(var j = 0; j < nodes.length; j++) {
							var nodeitem = nodes[j];
							if(nodeitem.tagName == "Longitude") {
								nodeitem.text = Position.X;
							} else if(nodeitem.tagName == "Latitude") {
								nodeitem.text = Position.Y;
							} else if(nodeitem.tagName == "Altitude") {
								nodeitem.text = Position.Z;
							}
						}
					}
					if(objitem.getAttribute("type") == "220") {
						var coordinates = objitem.getElementsByTagName("Coordinates");
						if(coordinates.length > 0) {
							var nodeitem = coordinates[0];
							var str = "";
							for(var ii = 0; ii < element.PointCount; ii++) {
								var point = element.GetPoint(ii);
								if(str != "") {
									str += " ";
								}
								str += point.X + "," + point.Y + "," + point.Z;
							}
							nodeitem.text = str;
						}
						var lengthNodes = objitem.getElementsByTagName("Length");
						if(lengthNodes.length > 0) {
							var nodeitem = lengthNodes[0];
							nodeitem.text = element.Length.toString();
						}
					}

					//贴地模式处理
					if(objitem.getAttribute("type") == "245" || objitem.getAttribute("type") == "211" || objitem.getAttribute("type") == "220") {
						var shadowType = objitem.getElementsByTagName("ShadowType");
						if(shadowType.length > 0) {
							shadowType = shadowType[0].text;
						} else {
							shadowType = '';
						}
						//说明使用的是贴地模式
						if(shadowType == '1') {
							var altitudes = element.GetClampAltitude();
							var altStr = '';
							if(altitudes != null && altitudes.Count > 0) {
								for(var ii = 0; ii < altitudes.Count; ii++) {
									var alt = altitudes.GetAt(ii);
									if(altStr != '') {
										altStr += ',';
									}
									altStr += alt;
								}
							}
							//说明之前没有添加这个节点
							if(objitem.getElementsByTagName('ClampAltitudes').length == 0) {
								var newEle = objitem.createElement('ClampAltitudes');
								var toEle = objitem.getElementsByTagName('ShadowStyle')[0];
								newEle.text = altStr;
								toEle.appendChild(newEle);
							} else {
								objitem.getElementsByTagName('ClampAltitudes')[0].text = altStr;
							}
						}
					}

					if(objitem.getAttribute("type") == "229" || objitem.getAttribute("type") == "250" ||
						objitem.getAttribute("type") == "252" || objitem.getAttribute('type') == '253' ||
						objitem.getAttribute("type") == "254" || objitem.getAttribute("type") == "251" ||
						objitem.getAttribute("type") == "255" || objitem.getAttribute("type") == "256" ||
						objitem.getAttribute("type") == "257" || objitem.getAttribute("type") == "258" ||
						objitem.getAttribute("type") == "259" || objitem.getAttribute("type") == "260") {
						var coordinates = objitem.getElementsByTagName("Coordinates");
						if(coordinates.length > 0) {
							var nodeitem = coordinates[0];
							var str = "";
							var points = element.GetControlPointArray();
							for(var ii = 0; ii < points.Count; ii++) {
								var point = points.Items(ii);
								if(str != "") {
									str += " ";
								}
								str += point.X + "," + point.Y + "," + point.Z;
							}
							nodeitem.text = str;
						}
					}

					if(objitem.getAttribute("type") == "228") {
						var arcCenter = objitem.getElementsByTagName('ArcCenter');
						if(arcCenter.length > 0) {
							var str = element.ArcCenter.X + ',' + element.ArcCenter.Y + ',' + element.ArcCenter.Z;
							arcCenter[0].text = str;
						}
						var angle = objitem.getElementsByTagName('Angle');
						if(angle.length > 0) {
							angle[0].text = element.Angle;
						}
						var radius = objitem.getElementsByTagName('Radius');
						if(radius.length > 0) {
							radius[0].text = element.Radius;
						}
					}

					if(objitem.getAttribute("type") == "dWater") {
						var vector3s = "";
						vector3s = element.GetExteriorRing();
						var ptString = "";
						for(var ii = 0; ii < vector3s.Count; ii++) {
							ptString += " " + vector3s.Items(ii).x + "," + vector3s.Items(ii).y + "," + vector3s.Items(ii).z;
						}
						var coordinates = objitem.getElementsByTagName("Coordinates");
						if(coordinates.length > 0) {
							var nodeitem = coordinates[0];
							nodeitem.text = ptString;
						}
					}

					if(objitem.getAttribute("type") == "207" || objitem.getAttribute("type") == "280") {
						var pList = "";
						var vector3s = element.Vectors;
						for(var ii = 0; ii < vector3s.Count; ii++) {
							var point = vector3s.Items(ii);
							pList += point.X + "," + point.Y + "," + point.Z + " ";
						}
						nodeitems = objitem.getElementsByTagName("PointList");
						if(nodeitems.length > 0) {
							nodeitems[0].text = pList;
						}
					}

					if(objitem.getAttribute("type") == "211" || objitem.getAttribute("type") == "245") {
						var coordinates = objitem.getElementsByTagName("Coordinates");
						if(coordinates.length > 0) {
							var nodeitem = coordinates[0];
							var str = "";
							var points = element.GetExteriorRing();
							for(var ii = 0; ii < points.Count; ii++) {
								var point = points.Items(ii);
								if(str != "") {
									str += " ";
								}
								str += point.X + "," + point.Y + "," + point.Z;
							}
							nodeitem.text = str;
						}
						var areaNodes = objitem.getElementsByTagName("Area");
						if(areaNodes.length > 0) {
							var nodeitem = areaNodes[0];
							nodeitem.text = element.area.toString();
						}
					}

					if(objitem.getAttribute("type") == "206" || objitem.getAttribute("type") == "206") {
						var sideNodes = objitem.getElementsByTagName("Sides");
						if(sideNodes.length > 0) {
							var nodeitem = sideNodes[0];
							nodeitem.text = element.Sides.toString();
						}
						var topRadiusNodes = objitem.getElementsByTagName("TopRadius");
						if(topRadiusNodes.length > 0) {
							var nodeitem = topRadiusNodes[0];
							nodeitem.text = element.TopRadius.toString();
						}
						var bottomRadiusNodes = objitem.getElementsByTagName("BottomRadius");
						if(bottomRadiusNodes.length > 0) {
							var nodeitem = bottomRadiusNodes[0];
							nodeitem.text = element.BottomRadius.toString();
						}
						var heightNodes = objitem.getElementsByTagName("Height");
						if(heightNodes.length > 0) {
							var nodeitem = heightNodes[0];
							nodeitem.text = element.Height.toString();
						}
					}

					if(objitem.getAttribute("type") == "202" || objitem.getAttribute("type") == "202") {
						var a = 1;
						var lengthNodes = objitem.getElementsByTagName("Length");
						if(lengthNodes.length > 0) {
							var nodeitem = lengthNodes[0];
							nodeitem.text = element.Length.toString();
						}
						var widthNodes = objitem.getElementsByTagName("Width");
						if(widthNodes.length > 0) {
							var nodeitem = widthNodes[0];
							nodeitem.text = element.Width.toString();
						}
						var heightNodes = objitem.getElementsByTagName("Height");
						if(heightNodes.length > 0) {
							var nodeitem = heightNodes[0];
							nodeitem.text = element.Height.toString();
						}
					}
				}
			}
		}
		editDataArr = [];
		var root = earth.Environment.RootPath + "userdata\\" + filename;
		earth.UserDocument.saveXmlFile(root, rootxml.xml);
		if(saveTag === "save") {
			saveTag = "";
		}
	};

	//编辑完调用方法 如果多次编辑多次保存数量多时会报错
	var createElementToEdit = function(obj, element, editMsg, rootxml) {

		var elementXML = getElementByGUID(rootxml, obj.guid);
		if(elementXML) {
			obj.desc = elementXML.getElementsByTagName("Description")[0].text;
		}
		var xmlData = createElementXml(obj, element);
		var xmlDoc = loadXMLStr("<xml>" + xmlData + "</xml>");

		var lookupNode = null;

		if(editMsg && !(editMsg["prev"] === undefined && editMsg["next"] === undefined)) {
			var prevNodeID = editMsg["prev"];
			var nextNodeID = editMsg["next"];
			if(prevNodeID) {
				var prevN = getElementByGUID(rootxml, prevNodeID);
				insertAfter(xmlDoc.documentElement.firstChild, prevN);
			} else if(nextNodeID) {
				var nextN = getElementByGUID(rootxml, nextNodeID);
				nextN.parentNode.insertBefore(xmlDoc.documentElement.firstChild, nextN);
			}
		} else {

			if(rootxml.childNodes.length > 1) {
				lookupNode = rootxml.childNodes[rootxml.childNodes.length - 1].firstChild;
			} else {
				lookupNode = rootxml.documentElement.firstChild;
			}
			lookupNode.appendChild(xmlDoc.documentElement.firstChild);
		}

	}

	//是否其他对象中包含所用材质
	var _containTexture = function(path, filterIndex) {
		var userDoc = getUserdata(filename);
		if(userDoc) {
			var elements = userDoc.getElementsByTagName("Element");
		}
		if(elements) {
			for(var i = 0; i < elements.length; i++) {
				if(i == filterIndex) {
					continue;
				} else {
					var texturePathTagNames = ['TextureImagePath', 'TexturePath'];
					for(var m = 0; m < texturePathTagNames.length; m++) {
						var texturePaths = elements[i].getElementsByTagName(texturePathTagNames[m]);
						for(var n = 0; n < texturePaths.length; n++) {
							var tpath = texturePaths[n].text.replace(/^\s+|\s+$/gm, '');
							if(tpath != '' && tpath == path) {
								return true;
							}
						}
					}
				}
			}
		}
		return false;
	}

	//删除使用到的所有的贴图资源
	var deleteAllTexure = function() {
		var userDoc = getUserdata(filename);
		if(userDoc) {
			var elements = userDoc.getElementsByTagName("Element");
		}
		if(elements) {
			for(var i = 0; i < elements.length; i++) {
				var texturePathTagNames = ['TextureImagePath', 'TexturePath'];
				for(var m = 0; m < texturePathTagNames.length; m++) {
					var texturePaths = elements[i].getElementsByTagName(texturePathTagNames[m]);
					for(var n = 0; n < texturePaths.length; n++) {
						var tpath = texturePaths[n].text.replace(/^\s+|\s+$/gm, '');
						if(tpath != '') {
							earth.UserDocument.DeleteFile(tpath);
						}
					}
				}
			}
		}
	}

	/**
	 * 根据id删除对应的element对象,同时保存到本地xml文件
	 * 注意:当进行编辑(移动,旋转等)操作后,这里要记录删除节点的相邻节点信息 以便同步到本地xml时候做插入位置的判断
	 *      如果不是编辑后的操作,这部分逻辑不需要处理,因此根据需要传入第三个参数进行判断处理一下 明白了吧?!
	 */
	var _deleteUserNode = function(id, filename, isEdit, zTree) {
		var userDoc = getUserdata(filename);
		var elementObj = _getElementByID(id);
		var elements;
		var editMsg = {};

		if(!elementObj) //如果找不到Element节点 说明是ElementFolder文件夹节点
		{
			//移除folder并且移除内部的各个子节点
			elements = userDoc.getElementsByTagName("ElementFolder");
		} else {
			elements = userDoc.getElementsByTagName("Element");
		}
		for(var i = 0; i < elements.length; i++) {
			var eleid = elements[i].getAttribute("id");
			if(eleid === id) {
				//针对编辑后的节点信息保存
				var texturePathTagNames = ['TextureImagePath', 'TexturePath'];
				for(var m = 0; m < texturePathTagNames.length; m++) {
					var texturePaths = elements[i].getElementsByTagName(texturePathTagNames[m]);
					for(var n = 0; n < texturePaths.length; n++) {
						var path = texturePaths[n].text.replace(/^\s+|\s+$/gm, '');
						if(path != '' && !_containTexture(path, i)) {
							earth.UserDocument.DeleteFile(path);
						}
					}
				}
				elements[i].parentNode.removeChild(elements[i]);
				if(saveTag == "save") { //savetag 判断对象是否经过偏移旋转等编辑d

				} else {
					if(elementObj) {}
				}
			}
		}
		var path = earth.Environment.RootPath + "userdata\\" + filename;
		earth.UserDocument.saveXmlFile(path, userDoc.xml);
		if(editMsg) {
			return editMsg;
		}
		if(saveTag == "save") {
			return;
		}
	};

	/**
	 * 右键编辑
	 * 根据id编辑对应的element对象
	 * 编辑对象思路:根据内存中的对象实时获取属性 不从本地XML里获取
	 * 当且仅当右键操作,程序初始化的时候才从xml里写入属性或者读取属性
	 */
	var _editUserNode = function(id, filename) {
		var obj = [];
		obj.click = "false";
		obj.earth = earth;
		obj.action = "edit";
		var userDoc = getUserdata(filename);
		var docElements = userDoc.getElementsByTagName("Element");

		var elements = userdataArr;
		for(var i = 0; i < userdataArr.length; i++) {
			var currentElement = userdataArr[i];
			var docElement = docElements[i];
			var eleid = currentElement.Guid;
			if(eleid === id) {
				obj.id = eleid;
				obj.action = "edit";
				//对象类型
				obj.type = currentElement.Rtti;
				obj.desc = docElement.getElementsByTagName("Description")[0].text;
				obj.name = docElement.getAttributeNode("name").nodeValue;
				obj.description = obj.desc;
				obj.type = Number(obj.type);
				var particleType = docElement.getAttributeNode("type").nodeValue;
				//警戒线
				if(particleType === "cordon") {
					obj.type = "cordon";
					obj.name = docElement.getAttributeNode("name").nodeValue
					obj.columHeight = docElement.getElementsByTagName("ColumHeight")[0].text;
					obj.columradius = docElement.getElementsByTagName("ColumRadius")[0].text;
					obj.bannerHeight = docElement.getElementsByTagName("BannerHeight")[0].text;
					obj.bannerWidth = docElement.getElementsByTagName("BannerWidth")[0].text;
					obj.texture = docElement.getElementsByTagName("Texture")[0].text;
					obj.texture2 = docElement.getElementsByTagName("Texture2")[0].text;
					obj.selectable = docElement.getElementsByTagName("Selectable")[0].text;
					obj.editable = docElement.getElementsByTagName("Editable")[0].text;
					var param = window.showModalDialog("html/userdata/cordon.html", obj, "dialogWidth=305px;dialogHeight=440px;status=no");
					if(!param) return;
					currentElement.name = obj.name;
					docElement.getAttributeNode("name").nodeValue = obj.name;
					docElement.getElementsByTagName("ColumHeight")[0].text = obj.columHeight.toString();
					docElement.getElementsByTagName("ColumRadius")[0].text = obj.columradius.toString();
					docElement.getElementsByTagName("BannerHeight")[0].text = obj.bannerHeight.toString();
					docElement.getElementsByTagName("BannerWidth")[0].text = obj.bannerWidth.toString();

					docElement.getElementsByTagName("Selectable")[0].text = obj.selectable;
					docElement.getElementsByTagName("Editable")[0].text = obj.editable;
					var thisCoor = docElement.getElementsByTagName("Coordinates")[0].text;
					thisCoor = thisCoor.split(" ");
					var vec3s = earth.Factory.CreateVector3s();
					for(var i = 0; i < thisCoor.length; i++) {
						var thisPoint = thisCoor[i];
						thisPoint = thisPoint.split(",");
						vec3s.Add(thisPoint[0], thisPoint[1], thisPoint[2]);
					}
					var lineGuid = earth.Factory.CreateGuid();
					var elementPyramid = earth.Factory.CreateElementLine(lineGuid, "line");
					elementPyramid.BeginUpdate();
					elementPyramid.SetPointArray(vec3s);
					elementPyramid.LineStyle.LineWidth = 1;
					elementPyramid.Visibility = true;
					elementPyramid.EndUpdate();
					earth.DetachObject(currentElement);
					var usbPath = docElement.getElementsByTagName("ObjPathUsb")[0].text;
					var path = earth.RootPath + 'userdata\\' + lineGuid + '.usb';
					docElement.getElementsByTagName("ObjPathUsb")[0].text = path;
					earth.UserDocument.DeleteFile(usbPath);
					var v3 = elementPyramid.Generate_GuardLine_Mesh(obj.texture, obj.texture2, path, obj.columradius, obj.columHeight, obj.bannerHeight, obj.bannerWidth);
					obj.path = earth.Environment.RootPath;
					var guid = earth.Factory.CreateGuid();
					obj.texture = obj.texture.split("\\");
					obj.texture = obj.texture[obj.texture.length - 1];
					obj.texture2 = obj.texture2.split("\\");
					obj.texture2 = obj.texture2[obj.texture2.length - 1];
					obj.texture = obj.path + obj.texture;
					obj.texture2 = obj.path + obj.texture2;
					docElement.getElementsByTagName("Texture")[0].text = obj.texture;
					docElement.getElementsByTagName("Texture2")[0].text = obj.texture2;

					var model = earth.Factory.CreateEditModelByLocal(eleid, obj.name, path, 1);
					model.SphericalTransform.SetLocationEx(v3.X, v3.Y, v3.Z);
					model.Selectable = obj.selectable;
					model.Editable = obj.editable;
					currentElement = model;
					earth.AttachObject(model);
				}

				//动态对象
				if(particleType === "fire" || particleType === "mist" || particleType === "fountain" || particleType === "nozzle" || particleType === "SprayNozzle" || particleType === "dWater" || particleType === "Explosion" || particleType === "WaterGunSmall") {
					window.showModalDialog("html/userdata/getParticleName.html", obj, "dialogWidth=240px;dialogHeight=105px;status=no");
					currentElement.name = obj.name;
				} else {
					if(currentElement.FillStyle) {
						obj.FillColor = currentElement.FillStyle.FillColor.toString(16);
					}
					if(currentElement.AltitudeType) {
						obj.shadow = currentElement.AltitudeType;
					};
				}

				//二维对象  line 220 circle 227 ellipse 243 sector 228 curve 229 polygon 211 texturepolygon 245 rectangle 245
				if(obj.type === 220 || obj.type === 227 || obj.type === 243 || obj.type === 228 || obj.type === 229 || obj.type === 211 || obj.type === 245) {
					obj.drawOrder = 0;
					obj.linewidth = currentElement.LineStyle.LineWidth;
					obj.linecolor = "#" + currentElement.LineStyle.LineColor.toString(16);
					if(obj.type === 220 || obj.type === 229 || obj.type === 211 || obj.type === 227 || obj.type === 243 || obj.type === 228) {
						obj.drawOrder = currentElement.DrawOrder;
					}

					//新增属性[可选择 可编辑]
					obj.selectable = currentElement.Selectable;
					obj.editable = currentElement.Editable;
					obj.shadow = currentElement.AltitudeType;
					if(obj.type != 220 && obj.type != 229) {
						obj.fillcolor = "#" + currentElement.FillStyle.FillColor.toString(16);
					}

					if(obj.type === 220 || obj.type === 229) {
						obj.arrow = currentElement.ArrowType;
					}

					if(obj.type === 227 || obj.type === 243 || obj.type === 228) {
						var rotation = currentElement.SphericalTransform.GetRotation();
						var scale = currentElement.SphericalTransform.GetScale();
						obj.rotation = rotation;
						obj.scale = scale;
					}

					//半径
					if(obj.type === 227 || obj.type === 228) {
						obj.radius = currentElement.Radius;
					}

					//长轴半径 短轴半径
					if(obj.type === 243) {
						obj.longRadius = currentElement.LongRadius;
						obj.shortRadius = currentElement.ShortRadius;
					}

					if(obj.type === 228) {
						obj.angle = currentElement.Angle;
					}

					//新增属性 [周长 面积]  obj.type === "texturePolygon" || obj.type === "rectangle"
					if(obj.type === 211 || obj.type === 227 || obj.type === 243 || obj.type === 228) {
						obj.perimeter = currentElement.Perimeter;
						obj.area = currentElement.Area;
					}
					//多边形贴图与矩形贴图
					if(obj.type === 245) {
						obj.expandX = currentElement.TextureTiltX;
						obj.expandY = currentElement.TextureTiltY;
						obj.picture = currentElement.TextureImagePath;
						obj.textture = currentElement.TextureMode;
						obj.shadow = currentElement.AltitudeType;
						obj.linecolor = "#" + currentElement.LineStyle.LineColor.toString(16);
						obj.fillcolor = "#" + currentElement.FillStyle.FillColor.toString(16);
						window.showModalDialog("html/userdata/texturePolygon.html", obj, "dialogWidth=300px;dialogHeight=590px;status=no");
						if(obj.click === "false") {
							return;
						}
						docElement.getElementsByTagName("TextureImagePath")[0].text = obj.picture;
						docElement.getElementsByTagName("ShadowType")[0].text = obj.shadow;
						docElement.getElementsByTagName("TextureTiltX")[0].text = obj.expandX;
						docElement.getElementsByTagName("TextureTiltY")[0].text = obj.expandY;
						docElement.getElementsByTagName("TextureMode")[0].text = obj.textture;

						docElement.getElementsByTagName("LineColor")[0].text = obj.linecolor;
						docElement.getElementsByTagName("FillColor")[0].text = obj.fillcolor;
						docElement.getElementsByTagName("LineWidth")[0].text = obj.linewidth;
						//贴地高程
						if(obj.shadow.toString() == '1') {
							//如果不提前设置的话会导致下面高程数组获取为空
							currentElement.AltitudeType = 1;
							var altitudes = currentElement.GetClampAltitude();
							var altStr = '';
							if(altitudes != null && altitudes.Count > 0) {
								for(var m = 0; m < altitudes.Count; m++) {
									var alt = altitudes.GetAt(m);
									if(altStr != '') {
										altStr += ',';
									}
									altStr += alt;
								}
							}
							docElement.getElementsByTagName('ClampAltitudes')[0].text = altStr;
						} else {
							docElement.getElementsByTagName('ClampAltitudes')[0].text = '';
						}
					} else {
						if(obj.type === 220) {
							obj.lineLength = currentElement.Length;
						}
						if(obj.type === 220) {
							window.showModalDialog("html/userdata/2DEdit.html", obj, "dialogWidth=300px;dialogHeight=595px;status=no");
						} else if(obj.type === 211 || obj.type === 227 || obj.type === 243 || obj.type === 228) { //曲线、多边形、圆、椭圆、扇形
							window.showModalDialog("html/userdata/2DEdit.html", obj, "dialogWidth=300px;dialogHeight=590px;status=no");
						} else if(obj.type === 229) {
							window.showModalDialog("html/userdata/2DEdit.html", obj, "dialogWidth=300px;dialogHeight=555px;status=no");
						}

						if(obj.click === "false") {
							return;
						}

						docElement.getElementsByTagName("LineWidth")[0].text = obj.linewidth;
						docElement.getElementsByTagName("ShadowColor")[0].text = obj.linecolor;
						docElement.getElementsByTagName("LineColor")[0].text = obj.linecolor;

						if(obj.type != 220) {
							docElement.getElementsByTagName("FillColor")[0].text = obj.fillcolor;
							docElement.getElementsByTagName("ShadowType")[0].text = obj.shadow;
						}
						if(obj.type === 228) {
							docElement.getElementsByTagName("Angle")[0].text = obj.angle;
						}
						//半径
						if(obj.type === 227 || obj.type === 228) {
							docElement.getElementsByTagName("Radius")[0].text = obj.radius;
						}
						if(obj.type === 220 || obj.type === 229) {
							docElement.getElementsByTagName("isShadowArrow")[0].text = obj.arrow;
						}
						//修改贴地
						if(obj.type === 220 || obj.type === 211 || obj.type === 245) {
							if(obj.shadow.toString() == '1') {
								//如果不提前设置的话会导致下面高程数组获取为空
								currentElement.AltitudeType = 1;
								var altitudes = currentElement.GetClampAltitude();
								var altStr = '';
								if(altitudes != null && altitudes.Count > 0) {
									for(var m = 0; m < altitudes.Count; m++) {
										var alt = altitudes.GetAt(m);
										if(altStr != '') {
											altStr += ',';
										}
										altStr += alt;
									}
								}
								docElement.getElementsByTagName('ClampAltitudes')[0].text = altStr;
							} else {
								docElement.getElementsByTagName('ClampAltitudes')[0].text = '';
							}
						}
					}

					//新增属性 [周长 面积]obj.type === "texturePolygon" || obj.type === "rectangle"
					if(obj.type === 211 || obj.type === 227 || obj.type === 243 || obj.type === 228) {
						docElement.getElementsByTagName("Perimeter")[0].text = obj.perimeter;
						docElement.getElementsByTagName("Area")[0].text = obj.area;
					}

					docElement.getElementsByTagName("Selectable")[0].text = obj.selectable;
					docElement.getElementsByTagName("Editable")[0].text = obj.editable;
					docElement.getAttributeNode("name").nodeValue = obj.name;

					if(obj.type === 220 || obj.type === 243 || obj.type === 228 || obj.type === 229 || obj.type === 211) {
						docElement.getElementsByTagName("DrawOrder")[0].text = obj.drawOrder;
					}

					//半径
					if(obj.type === 227 || obj.type === 228) {
						docElement.getElementsByTagName("Radius")[0].text = obj.radius;
					}

					//长轴半径 短轴半径
					if(obj.type === 243) {
						docElement.getElementsByTagName("LongRadius")[0].text = obj.longRadius;
						docElement.getElementsByTagName("ShortRadius")[0].text = obj.shortRadius;
					}
				}

				//军标部分  tailSArrow 250  EqualSArrow = 251 TailSArrow = 252, CustomArrow = 253,  CustomTailArrow = 254,  DoubleArrow = 255,  XArrow = 256,  AssemblyArea = 260, trangleFlag = 257 rectFlag = 258 curveFlag = 259
				if(obj.type === 250 || obj.type === 251 || obj.type === 252 || obj.type === 253 || obj.type === 254 || obj.type === 255 || obj.type === 256 || obj.type === 257 || obj.type === 258 || obj.type === 259 || obj.type === 260) { //军标编辑
					obj.action = "edit";
					obj.linewidth = currentElement.LineStyle.LineWidth;
					obj.linecolor = "#" + currentElement.LineStyle.LineColor.toString(16);
					obj.fillcolor = "#" + currentElement.FillStyle.FillColor.toString(16);

					//新增属性
					if(obj.type === 250 || obj.type === 251 || obj.type === 252 || obj.type === 253 || obj.type === 254 || obj.type === 255 || obj.type === 256 || obj.type === 260) {
						obj.drawOrder = currentElement.DrawOrder;
						obj.selectable = currentElement.Selectable;
						obj.editable = currentElement.Editable;
					}

					obj.Shadow = currentElement.AltitudeType;
					if(obj.type === 250 || obj.type === 251 || obj.type === 252 || obj.type === 253 || obj.type === 254 || obj.type === 255 || obj.type === 256 || obj.type === 260) {
						window.showModalDialog("html/userdata/MilitaryTagData.html", obj, "dialogWidth=295px;dialogHeight=552px;status=no");
					} else {
						window.showModalDialog("html/userdata/MilitaryTagData.html", obj, "dialogWidth=295px;dialogHeight=385px;status=no");
					}

					if(obj.click === "false") {
						return;
					}
					currentElement.name = obj.name;
					docElement.getElementsByTagName("LineWidth")[0].text = obj.linewidth;
					docElement.getElementsByTagName("LineColor")[0].text = obj.linecolor;
					docElement.getElementsByTagName("FillColor")[0].text = obj.fillcolor;
					docElement.getElementsByTagName("Shadow")[0].text = obj.Shadow;
					docElement.getElementsByTagName("Description")[0].text = obj.desc;
					docElement.getAttributeNode("name").nodeValue = obj.name;
					//新增属性
					if(obj.type === 250 || obj.type === 251 || obj.type === 252 || obj.type === 253 || obj.type === 254 || obj.type === 255 || obj.type === 256 || obj.type === 260) {
						docElement.getElementsByTagName("DrawOrder")[0].text = obj.drawOrder;
						docElement.getElementsByTagName("Selectable")[0].text = obj.selectable;
						docElement.getElementsByTagName("Editable")[0].text = obj.editable;
					}
				}

				if(obj.type === 210) {
					obj.linecolor = "#" + currentElement.LineStyle.LineColor.toString(16);
					obj.radius = currentElement.radius;
					obj.segment = currentElement.segment;
					window.showModalDialog("html/userdata/signalsphere.html", obj, "dialogWidth=284px;dialogHeight=350px;status=no");

					if(obj.click === "false") {
						return;
					}
					docElement.getElementsByTagName("LineColor")[0].text = obj.linecolor;
					docElement.getElementsByTagName("Radius")[0].text = obj.radius;
					docElement.getElementsByTagName("Segment")[0].text = obj.segment;
				}

				//三维图元[编辑]
				if(obj.type === 216 || obj.type === 202 || obj.type === 207 || obj.type === 203 ||
					obj.type === 204 || obj.type === 205 || obj.type === 206) {
					obj.action = "edit";
					obj.name = currentElement.name;

					obj.FillColor = "#" + currentElement.FillColor.toString(16);

					//从三维显示对象中获取材质
					var ary = [];
					if(obj.type === 216) {
						var materialStyle = currentElement.MaterialStyles.Items(0);
						ary.push("", "", materialStyle.DiffuseTexture);
					} else {
						var count = currentElement.MaterialStyles.Count;
						if(currentElement.MaterialStyles.Items(0)) { //判断是否存在
							for(var m = 0; m < count; m++) {
								var materialStyle = currentElement.MaterialStyles.Items(m);
								ary.push(materialStyle.DiffuseTexture);
							}
						}
					}
					obj.texturePath = ary;

					obj.selectable = currentElement.Selectable;
					obj.editable = currentElement.Editable;
					obj.objectFlagType = currentElement.Underground;

					if(obj.type === 216 || obj.type === 203 || obj.type === 205) {
						obj.radius = currentElement.Radius;
					}

					if(obj.type === 202) { //长方体
						obj.longValue = currentElement.Length;
						obj.widthValue = currentElement.Width;
						obj.heightValue = currentElement.Height;
					} else if(obj.type === 207) { //立体多边形
						obj.heightValue = currentElement.Height;
					} else if(obj.type === 203) { //圆柱
						obj.bottomRadius = currentElement.Radius;
						obj.heightValue = currentElement.Height;
					} else if(obj.type === 204) { //圆台
						obj.bottomRadius = currentElement.BottomRadius;
						obj.topRadius = currentElement.TopRadius;
						obj.heightValue = currentElement.Height;
					} else if(obj.type === 205) { //棱柱
						obj.bottomRadius = currentElement.Radius;
						obj.heightValue = currentElement.Height;
						obj.sides = currentElement.Sides;
					} else if(obj.type === 206) { //棱台
						obj.bottomRadius = currentElement.BottomRadius;
						obj.topRadius = currentElement.TopRadius;
						obj.heightValue = currentElement.Height;
						obj.sides = currentElement.Sides;
					}

					obj.earth = earth;
					if(obj.type === 206) {
						window.showModalDialog("html/userdata/3DEdit.html", obj, "dialogWidth=305px;dialogHeight=630px;status=no");
					} else if(obj.type === 216) { //球体
						window.showModalDialog("html/userdata/3DEdit.html", obj, "dialogWidth=305px;dialogHeight=470px;status=no");
					} else if(obj.type === 207) {
						window.showModalDialog("html/userdata/3DEdit.html", obj, "dialogWidth=315px;dialogHeight=550px;status=no");
					} else if(obj.type === 203) { //203圆柱
						window.showModalDialog("html/userdata/3DEdit.html", obj, "dialogWidth=305px;dialogHeight=600px;status=no");
					} else { //202立方体
						window.showModalDialog("html/userdata/3DEdit.html", obj, "dialogWidth=305px;dialogHeight=640px;status=no");
					}

					if(obj.click === "false") {
						return;
					}
					if(obj.type === 216) {
						docElement.getElementsByTagName("TexturePath")[1].text = obj.texturePath[2];
						docElement.getElementsByTagName("Radius")[0].text = obj.radius;
					} else {
						docElement.getElementsByTagName("TexturePath")[0].text = obj.texturePath[0];
						docElement.getElementsByTagName("TexturePath")[1].text = obj.texturePath[1];
						docElement.getElementsByTagName("TexturePath")[2].text = obj.texturePath[2];
					}
					docElement.getElementsByTagName("FillColor")[0].text = obj.fillcolor;
					//新增接口
					docElement.getElementsByTagName("Selectable")[0].text = obj.selectable;
					docElement.getElementsByTagName("Editable")[0].text = obj.editable;
					docElement.getElementsByTagName("ObjectFlagType")[0].text = obj.objectFlagType;

					if(obj.type === 202) { //长方体
						docElement.getElementsByTagName("Length")[0].text = obj.longValue;
						docElement.getElementsByTagName("Width")[0].text = obj.widthValue;
						docElement.getElementsByTagName("Height")[0].text = obj.heightValue;
					} else if(obj.type === 207) { //立体多边形
						docElement.getElementsByTagName("Height")[0].text = obj.heightValue;
					} else if(obj.type === 203) { //圆柱
						docElement.getElementsByTagName("Radius")[0].text = obj.bottomRadius;
						docElement.getElementsByTagName("Height")[0].text = obj.heightValue;
					} else if(obj.type === 204) { //圆台
						docElement.getElementsByTagName("Radius")[0].text = obj.bottomRadius;
						docElement.getElementsByTagName("TopRadius")[0].text = obj.topRadius;
						docElement.getElementsByTagName("Height")[0].text = obj.heightValue;
					} else if(obj.type === 205) { //棱柱
						docElement.getElementsByTagName("Radius")[0].text = obj.bottomRadius;
						docElement.getElementsByTagName("Height")[0].text = obj.heightValue;
						docElement.getElementsByTagName("Sides")[0].text = obj.sides;
					} else if(obj.type === 206) { //棱台
						docElement.getElementsByTagName("BottomRadius")[0].text = obj.bottomRadius;
						docElement.getElementsByTagName("TopRadius")[0].text = obj.topRadius;
						docElement.getElementsByTagName("Height")[0].text = obj.heightValue;
						docElement.getElementsByTagName("Sides")[0].text = obj.sides;
					}

					docElement.getAttributeNode("name").nodeValue = obj.name;
				}

				//simplebuilding 280 model 223 SimpleBillboard 217 icon 209 guid 244
				if(obj.type === 280 || obj.type === 223 || obj.type === 217 || obj.type === 209 || obj.type === 244) {
					obj.action = "edit";
					obj.earth = earth;
					obj.path = earth.Environment.RootPath;
					obj.longitude = currentElement.Longitude;
					obj.latitude = currentElement.Latitude;
					obj.altitude = currentElement.Altitude;
					obj.name = currentElement.name;
					if(obj.type === 223) {
						var tag = docElement.getElementsByTagName("ObjectFlagType")[0].text;
						switch(tag) {
							case "1":
								obj.flag = "model";
								break;
							case "2":
								obj.flag = "tree";
								break;
							case "3":
								obj.flag = "furniture";
								break;
						}
						obj.link = currentElement.Link;
						var lastLink = obj.link;
						window.showModalDialog("html/userdata/modelData.html", obj, "dialogWidth=283px;dialogHeight=218px;status=no");
						if(obj.click === "false") {
							return;
						}
						docElement.getElementsByTagName("Link")[0].text = obj.link;
					} else if(obj.type === 217) { //广告牌
						obj.width = currentElement.Width;
						obj.height = currentElement.Height;
						obj.iconFileName = currentElement.Image; //路径
						window.showModalDialog("html/userdata/pictureData.html", obj, "dialogWidth=370px;dialogHeight=300px;status=no");
						if(obj.click === "false") {
							return;
						}
						docElement.getElementsByTagName("Width")[0].text = obj.width;
						docElement.getElementsByTagName("Height")[0].text = obj.height;
						docElement.getElementsByTagName("Icon")[0].text = obj.iconFileName;
					} else if(obj.type === 209) { //二维图标
						obj.name = currentElement.name;
						obj.guid = currentElement.Guid;

						obj.iconNormalFileName = currentElement.normalIcon.iconlink;
						obj.iconSelectedFileName = currentElement.highlighticon.iconlink;

						//新增属性
						obj.textFormat = "0x" + currentElement.textFormat.toString(16);
						obj.textColor = "#" + currentElement.TextColor.toString(16);
						obj.textHorizontalScale = currentElement.TextHorizontalScale;
						obj.textVerticalScale = currentElement.TextVerticalScale;
						obj.showHandle = currentElement.ShowHandle;
						obj.handleHeight = currentElement.HandleHeight;
						obj.handleColor = "#" + currentElement.HandleColor.toString(16);
						obj.minVisibleRange = currentElement.MinVisibleRange;
						obj.maxVisibleRange = currentElement.MaxVisibleRange;
						obj.selectable = currentElement.Selectable;
						obj.editable = currentElement.Editable;
						window.showModalDialog("html/userdata/iconData.html", obj, "dialogWidth=354px;dialogHeight=595px;status=no");
						if(obj.click === "false") {
							return;
						}
						docElement.getElementsByTagName("Icon")[0].text = obj.iconNormalFileName;
						docElement.getElementsByTagName("Icon")[1].text = obj.iconSelectedFileName;

						docElement.getElementsByTagName("TextFormat")[0].text = obj.textFormat;
						docElement.getElementsByTagName("TextColor")[0].text = obj.textColor;
						docElement.getElementsByTagName("TextHorizontalScale")[0].text = obj.textHorizontalScale;
						docElement.getElementsByTagName("TextVerticalScale")[0].text = obj.textVerticalScale;
						docElement.getElementsByTagName("ShowHandle")[0].text = obj.showHandle;
						docElement.getElementsByTagName("HandleHeight")[0].text = obj.handleHeight;
						docElement.getElementsByTagName("HandleColor")[0].text = obj.handleColor;
						docElement.getElementsByTagName("MinVisibleRange")[0].text = obj.minVisibleRange;
						docElement.getElementsByTagName("MaxVisibleRange")[0].text = obj.maxVisibleRange;
						docElement.getElementsByTagName("Selectable")[0].text = obj.selectable;
						docElement.getElementsByTagName("Editable")[0].text = obj.editable;

					} else if(obj.type === 207) { //latt

					} else if(obj.type === 280) { //SimpleBuilding 简单建筑

						obj.floorCount = currentElement.GetFloorsCount();
						obj.floorHeight = currentElement.GetFloorHeight();

						var floorMats = currentElement.GetFloorsMaterialStyles();
						//屋顶材质
						obj.roofTexture = floorMats.Items(0).DiffuseTexture;
						//楼层材质
						for(var k = 2; k < floorMats.Count; k++) {
							obj.floorTexture = floorMats.Items(k).DiffuseTexture;
						}

						obj.roofTypeNode = currentElement.GetRoofType();
						//屋顶颜色
						obj.roofColor = "#" + currentElement.RoofColor.toString(16);
						//屋低颜色
						obj.floorColor = "#" + currentElement.FloorsColor.toString(16);
						window.showModalDialog("html/userdata/SimpleBuiliding.html", obj, "dialogWidth=345px;dialogHeight=490px;status=no");
						if(obj.click === "false") {
							return;
						}
						docElement.getElementsByTagName("FloorCount")[0].text = obj.floorCount;
						docElement.getElementsByTagName("FloorHeight")[0].text = obj.floorHeight;
						docElement.getElementsByTagName("FloorTexture")[0].text = obj.floorTexture;
						docElement.getElementsByTagName("RoofTexture")[0].text = obj.roofTexture;
						docElement.getElementsByTagName("RoofType")[0].text = obj.roofTypeNode;
						docElement.getElementsByTagName("RoofColor")[0].text = obj.roofColor;
						docElement.getElementsByTagName("FloorColor")[0].text = obj.floorColor;
					}
				}
				docElement.getAttributeNode("name").nodeValue = obj.name;
				var shadowType = docElement.getElementsByTagName("ShadowType");
				if(shadowType.length != 0) {
					shadowType[0].text = obj.shadow;
				}

				var str = JSON.stringify(obj.desc);
				if(str != undefined) {
					docElement.getElementsByTagName("Description")[0].text = obj.desc;
				}
				//给要素赋name属性
				currentElement.name = obj.name;

				_editElementToEarth(id, obj, currentElement);
				var path = earth.Environment.RootPath + "userdata\\" + filename;
				earth.UserDocument.saveXmlFile(path, userDoc.xml);
				return obj.name;
			}
		}
	};
	/**
	 * 根据id得到对应的element对象
	 * 是从userdataArr里还是从objArr里面?
	 */
	var _getElementByID = function(id) {
		var eleObj = null;
		if(userdataArr == null) return null;
		for(var i = 0; i < userdataArr.length; i++) {
			var eobj = userdataArr[i];
			if(eobj && eobj.guid == id) {
				eleObj = eobj;
			}
		}
		return eleObj;
	};
	/**
	 * 图元或对象编辑以后在球上实时修改
	 *
	 */
	var _editElementToEarth = function(id, obj, currentElement) {
		var editObj = _getElementByID(id);

		//二维图元在球上实时修改//curve LineWidth LineColor IsAddArrow;sector FillColor
		//line 220 circle 227 ellipse 243 sector 228 curve 229 polygon 211 texturepolygon 245 rectangle 245
		if(obj.type === 220 || obj.type === 227 || obj.type === 243 || obj.type === 228 || obj.type === 229 || obj.type === 211 || obj.type === 245) {
			editObj.BeginUpdate();
			editObj.name = obj.name;
			if(obj.type === 220) {
				editObj.LineStyle.LineWidth = obj.linewidth;
				editObj.LineStyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
				editObj.ArrowType = obj.arrow;
			} else if(obj.type === 229) {
				editObj.LineStyle.LineWidth = obj.linewidth;
				editObj.LineStyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
				editObj.FillStyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				editObj.ArrowType = obj.arrow;
			} else if(obj.type === 245) {
				editObj.FillStyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());;
				editObj.TextureImagePath = obj.picture;
				editObj.TextureMode = obj.textture; //  0 无纹理        1 平铺纹理   2 拉伸（必须四个顶点）
				editObj.TextureTiltX = obj.expandX; //  横向平铺重复次shu
				editObj.TextureTiltY = obj.expandY; //  纵向平铺重复次shu
				editObj.LineStyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
				editObj.LineStyle.LineWidth = obj.linewidth;
			} else {
				editObj.FillStyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				editObj.LineStyle.LineWidth = obj.linewidth;
				editObj.LineStyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
			}

			//对 折线 曲线 多边形 圆 椭圆 扇形 这六个支持"渲染顺序"属性
			if(obj.type === 220 || obj.type === 229 || obj.type === 211 || obj.type === 227 || obj.type === 243 || obj.type === 228) {
				editObj.DrawOrder = obj.drawOrder;
			}

			editObj.AltitudeType = obj.shadow;
			editObj.selectable = obj.selectable;
			editObj.editable = obj.editable;

			if(obj.type === 228) {
				editObj.Angle = Number(obj.angle);
				editObj.radius = Number(obj.radius);
			}

			if(obj.type === 227) {
				editObj.radius = Number(obj.radius);
			}

			if(obj.type === 243) {
				editObj.LongRadius = obj.longRadius;
				editObj.ShortRadius = obj.shortRadius;
			}
			if(obj.type === 227 || obj.type === 243 || obj.type === 228) {
				editObj.SphericalTransform.SetRotationEx(obj.rotation.x, obj.rotation.y, obj.rotation.z);
				editObj.SphericalTransform.SetScaleEx(obj.scale.x, obj.scale.y, obj.scale.z);
			}
			editObj.EndUpdate();
		}

		//军标图元在球上实时修改
		if(obj.type === 250 || obj.type === 251 || obj.type === 252 || obj.type === 253 || obj.type === 254 || obj.type === 255 || obj.type === 256 || obj.type === 257 || obj.type === 258 || obj.type === 259 || obj.type === 260) {

			var vector3s = editObj.GetControlPointArray();
			editObj.BeginUpdate();

			//新增属性
			if(obj.type === 250 || obj.type === 251 || obj.type === 252 || obj.type === 253 || obj.type === 254 || obj.type === 255 || obj.type === 256 || obj.type === 260) {
				editObj.selectable = obj.selectable;
				editObj.editable = obj.editable;
				editObj.DrawOrder = obj.drawOrder;
				editObj.AltitudeType = obj.Shadow;
			}

			editObj.SetControlPointArray(vector3s);
			var linestyle = editObj.LineStyle;
			linestyle.LineWidth = obj.linewidth;
			linestyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
			var fillstyle = editObj.FillStyle;
			fillstyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
			editObj.EndUpdate();
			earth.AttachObject(editObj);

		}

		//信号辐射球
		if(obj.type === 210) {
			editObj.BeginUpdate();
			editObj.radius = obj.radius;
			editObj.segment = obj.segment;
			var linestyle = editObj.LineStyle;
			linestyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());

			editObj.EndUpdate();
			earth.AttachObject(editObj);
		}

		//三维图元在球上实时修改
		//sphere 216 box 202 volume 207 cylinder 203 cone 204 prism 205 pyramid 206
		if(obj.type === 216 || obj.type === 202 || obj.type === 207 || obj.type === 203 ||
			obj.type === 204 || obj.type === 205 || obj.type === 206) {

			if(obj.type == 205 || obj.type == 206) {
				// 棱柱、棱台
				// 修改Sides后EndUpdate()后，IE崩溃，故重新创建
				var editObjTemp = editObj;
				if(obj.type == 205) {
					editObj = earth.Factory.CreateElementPrism(editObjTemp.Guid, editObjTemp.Name);
				} else if(obj.type == 206) {
					editObj = earth.Factory.CreateElementPyramid(editObjTemp.Guid, editObjTemp.Name);
				}
				editObj.Name = editObjTemp.Name;
				var tranTemp = editObjTemp.SphericalTransform;
				var tran = editObj.SphericalTransform;
				tran.SetLocationEx(tranTemp.Longitude, tranTemp.Latitude, tranTemp.Altitude);
				editObj.Visibility = true;
				var rv3 = editObjTemp.SphericalTransform.GetRotation();
				editObj.SphericalTransform.SetRotationEx(rv3.X, rv3.Y, rv3.Z);
				var sv3 = editObjTemp.SphericalTransform.GetScale();
				editObj.SphericalTransform.SetScaleEx(sv3.X, sv3.Y, sv3.Z);

				var prism = earth.Factory.CreateElementPrism(obj.id, obj.name);
				prism.name = obj.name;
				var tran = prism.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				earth.DetachObject(editObjTemp);

				if(userdataArr && userdataArr.length > 0) {
					for(var i = 0; i < userdataArr.length; i++) {
						var eobj = userdataArr[i];
						if(eobj && eobj.Guid == editObj.Guid) {
							userdataArr[i] = editObj;
						}
					}
				}
			}

			editObj.BeginUpdate();
			editObj.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());

			//新增属性
			editObj.selectable = obj.selectable;
			editObj.editable = obj.editable;
			editObj.Underground = obj.objectFlagType;

			if(obj.type === 216) {
				editObj.radius = obj.radius;
			}

			//立方体实时修改
			if(obj.type === 202) {
				editObj.Height = obj.heightValue;
				editObj.Width = obj.widthValue;
				editObj.Length = obj.longValue;
			}

			//立方体多边形实时修改
			if(obj.type === 207) {
				editObj.Height = obj.heightValue;
			}

			//圆柱实时修改
			if(obj.type === 203) {
				editObj.radius = obj.bottomRadius;
				editObj.Height = obj.heightValue;
			}

			//圆锥实时修改
			if(obj.type === 204) {
				editObj.Height = obj.heightValue;
				editObj.BottomRadius = obj.bottomRadius;
				editObj.TopRadius = obj.topRadius;
			}

			//棱柱实时修改
			if(obj.type === 205) {
				editObj.Radius = obj.bottomRadius;
				editObj.Height = obj.heightValue;
				editObj.Sides = obj.sides;
			}

			//棱锥实时修改
			if(obj.type === 206) {
				editObj.Height = obj.heightValue;
				editObj.BottomRadius = obj.bottomRadius;
				editObj.TopRadius = obj.topRadius;
				editObj.Sides = obj.sides;
			}

			var count = editObj.MaterialStyles.Count;
			for(var m = 0; m < count; m++) {
				var materialStyle = editObj.MaterialStyles.Items(m);
				materialStyle.DiffuseTexture = obj.texturePath[m];
				if(obj.type === 216) {
					materialStyle.DiffuseTexture = obj.texturePath[2];
				}
			}

			editObj.EndUpdate();
			if(obj.type == 205 || obj.type == 206) {
				earth.AttachObject(editObj);
			}
		}
		//导入数据在球上实时修改
		if(obj.type === 280 || obj.type === 223 || obj.type === 217 || obj.type === 209 || obj.type === 244) {
			if(obj.type === 223) {
				var model = earth.Factory.CreateEditModelByLocal(obj.id, obj.name, obj.link, 3);
				model.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);

			} else if(obj.type === 217) {
				editObj.BeginUpdate();
				editObj.Width = obj.width;
				editObj.Height = obj.height;
				editObj.Image = obj.iconFileName;
				editObj.EndUpdate();
			} else if(obj.type === 209) {
				var guid = earth.Factory.CreateGUID();
				var myicon = earth.Factory.CreateElementIcon(obj.guid, obj.name);
				var originIndex = editObj.guid;
				myicon.name = obj.name;
				var lon = editObj.SphericalTransform.longitude;
				var lat = editObj.SphericalTransform.latitude;
				var alt = editObj.SphericalTransform.altitude;
				earth.DetachObject(editObj);
				myicon.LineSize = 7;
				myicon.Create(lon, lat, alt, obj.iconNormalFileName, obj.iconSelectedFileName, obj.name);
				//新增属性
				myicon.textFormat = parseInt(obj.textFormat);
				myicon.textColor = parseInt("0x" + obj.textColor.toString().substring(1).toLowerCase());
				myicon.textHorizontalScale = obj.textHorizontalScale;
				myicon.textVerticalScale = obj.textVerticalScale;
				myicon.showHandle = obj.showHandle;
				myicon.handleHeight = obj.handleHeight;
				myicon.handleColor = parseInt("0x" + obj.handleColor.toString().substring(1).toLowerCase());
				myicon.minVisibleRange = parseInt(obj.minVisibleRange);
				myicon.maxVisibleRange = parseInt(obj.maxVisibleRange);
				myicon.selectable = obj.selectable;
				myicon.editable = obj.editable;

				myicon.Visibility = true;
				earth.AttachObject(myicon);
				for(var i = userdataArr.length - 1; i >= 0; i--) {
					if(userdataArr[i].guid === originIndex) {
						originIndex = i;
						userdataArr.splice(i, 1, myicon);
					}
				};

			} else if(obj.type === 280) {
				editObj.BeginUpdate();
				editObj.SetFloorHeight(obj.floorHeight);
				editObj.SetFloorsHeight(obj.floorHeight * obj.floorCount);
				editObj.SetRoofType(parseInt(obj.roofTypeNode));
				var roofcolor = parseInt("0x" + obj.roofColor.toString().substring(1).toLowerCase());
				var floorcolor = parseInt("0x" + obj.floorColor.toString().substring(1).toLowerCase());
				editObj.FloorsColor = floorcolor;
				editObj.RoofColor = roofcolor;
				var floorMats = editObj.GetFloorsMaterialStyles();
				floorMats.Items(0).DiffuseTexture = obj.roofTexture;
				floorMats.Items(1).DiffuseTexture = obj.roofTexture;
				for(var i = 2; i < floorMats.Count; i++) {
					floorMats.Items(i).DiffuseTexture = obj.floorTexture;
				}

				editObj.EndUpdate();
			} else if(obj.type === 244) {
				editObj.BeginUpdate();
				editObj.Altitude = obj.height;
				editObj.EndUpdate();
			}
		}

	};
	/**
	 * 根据filename判断
	 * 得到的本地用户数据是二维、三维还是导入模型
	 */
	var getUserdata = function(filename) {
		url = earth.Environment.RootPath + "userdata\\" + filename + ".xml";
		var xmlData = earth.UserDocument.loadXmlFile(url); // 得到xml数据；
		if(xmlData == "") {
			var userdataGUID = earth.Factory.createGuid();
			var userdataXml = "<Xml><ElementDocument id='" + userdataGUID + "' name='" + treeRootName + "' im0='folderOpen.gif' type='folder' checked='0' open='false'></ElementDocument></Xml>";
			var userdata = earth.Environment.RootPath + "userData\\" + filename;
			earth.UserDocument.saveXmlFile(userdata, userdataXml);
			xmlData = userdataXml;
		}
		return loadXMLStr(xmlData);
	}

	/**
	 *   是否绑定对象到Earth上
	 */
	function attachObject(checked, obj) {
		if(Number(checked) != 1) {
			obj.Visibility = false;
			obj.Selectable = false;
		};
	};

	/**
	 * 转换
	 * @param {Object} element  元素
	 * @param {Object} obj  对象
	 */
	function setTransform(element, obj) {
		var rotation = obj.getElementsByTagName("Rotation")[0].text;
		var scale = obj.getElementsByTagName("Scale")[0].text;
		var position = obj.getElementsByTagName("Position")[0].text;

		rotation = rotation.split(",");
		scale = scale.split(",");
		position = position.split(",");

		var objType = element.rtti;
		if(objType === 250 || objType === 251 || objType === 252 || objType === 253 || objType === 254 || objType === 255 || objType === 256 || objType === 257 || objType === 258 || objType === 259 || objType === 260) {

		}
	};

	//设置高程
	var setClampAltitude = function(element, altStr) {
		var dArr = earth.Factory.CreateDoubleArray();
		if(altStr == '') {
			return;
		}
		var altStrArr = altStr.split(',');
		for(var i = 0; i < altStrArr.length; i++) {
			var altNum = Number(altStrArr[i]);
			dArr.Add(altNum);
		}
		element.SetClampAltitude(dArr);
	}

	/**
	 * 解析本地xml构建地标对象，并将所有对象绑定在地球上，并显示
	 */
	var getAllIconObjs = function(currUserdataDoc) {
		userdataArr = [];
		if(currUserdataDoc == null) {
			return;
		}
		var explosionObjs = [];
		var element = currUserdataDoc.getElementsByTagName("Element");
		for(var i = 0; i < element.length; i++) {
			var obj = {};
			var elementObj = element[i];
			var checked = elementObj.getAttribute("checked");
			obj.id = elementObj.getAttribute("id");
			obj.guid = obj.id;
			obj.name = elementObj.getAttribute("name");
			obj.type = elementObj.getAttribute("type");
			obj.desc = elementObj.getElementsByTagName("Description")[0].text;
			var rotation = elementObj.getElementsByTagName("Rotation")[0].text;
			var scale = elementObj.getElementsByTagName("Scale")[0].text;
			rotation = rotation.split(",");
			scale = scale.split(",");
			if(elementObj.getElementsByTagName("FillColor")[0]) {
				obj.fillColor = elementObj.getElementsByTagName("FillColor")[0].text;
				obj.fillcolor = obj.fillColor;
			}
			obj.longitude = elementObj.getElementsByTagName("Longitude")[0].text;
			obj.latitude = elementObj.getElementsByTagName("Latitude")[0].text;
			obj.altitude = elementObj.getElementsByTagName("Altitude")[0].text;
			obj.type = elementObj.getAttribute("type");
			var objType = Number(obj.type);
			//军标部分
			if(objType === 250 || objType === 251 || objType === 252 || objType === 253 || objType === 254 || objType === 255 || objType === 256 || objType === 257 || objType === 258 || objType === 259 || objType === 260) {

				obj.fillColor = elementObj.getElementsByTagName("FillColor")[0].text;
				obj.lineColor = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.fillcolor = obj.fillColor;
				obj.linecolor = obj.lineColor;
				obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				obj.Shadow = elementObj.getElementsByTagName("Shadow")[0].text;

				//新增属性
				if(objType === 250 || objType === 251 || objType === 252 || objType === 253 || objType === 254 || objType === 255 || objType === 256 || objType === 260) {
					obj.drawOrder = elementObj.getElementsByTagName("DrawOrder")[0].text;
					obj.selectable = elementObj.getElementsByTagName("Selectable")[0].text;
					obj.editable = elementObj.getElementsByTagName("Editable")[0].text;
				}
				var PointList = elementObj.getElementsByTagName("Coordinates")[0].text;
				var vecs = PointList.split(" ");
				var v3s = earth.Factory.CreateVector3s();
				for(var k = 0; k < vecs.length; k++) {
					var v = vecs[k].split(",");
					var v3 = earth.Factory.CreateVector3();
					v3.X = v[0];
					v3.Y = v[1];
					v3.Z = v[2];
					v3s.AddVector(v3);
				}
				obj.vector3s = v3s;
				obj.guid = obj.id;
				if(objType === 250) {
					var editObj = earth.Factory.CreateElementPlotSArrow(obj.id, obj.name);
				} else if(objType === 253) {
					var editObj = earth.Factory.CreateElementPlotCustomArrow(obj.id, obj.name);
				} else if(objType === 252) {
					var editObj = earth.Factory.CreateElementPlotTailSArrow(obj.id, obj.name);
				} else if(objType === 254) {
					var editObj = earth.Factory.CreateElementPlotCustomTailArrow(obj.id, obj.name);
				} else if(objType === 251) {
					var editObj = earth.Factory.CreateElementPlotEqualSArrow(obj.id, obj.name);
				} else if(objType === 255) {
					var editObj = earth.Factory.CreateElementPlotDoubleArrow(obj.id, obj.name);
				} else if(objType === 256) {
					var editObj = earth.Factory.CreateElementPlotXArrow(obj.id, obj.name);
				} else if(objType === 260) {
					var editObj = earth.Factory.CreateElementPlotAssemblyArea(obj.id, obj.name);
				} else if(objType === 257) {
					var editObj = earth.Factory.CreateElementPlotTriangleFlag(obj.id, obj.name);
				} else if(objType === 258) {
					var editObj = earth.Factory.CreateElementPlotRectFlag(obj.id, obj.name);
				} else if(objType === 259) {
					var editObj = earth.Factory.CreateElementPlotCurveFlag(obj.id, obj.name);
				}
				editObj.BeginUpdate();
				editObj.name = obj.name;

				//新属性
				if(objType === 250 || objType === 251 || objType === 252 || objType === 253 || objType === 254 || objType === 255 || objType === 256 || objType === 260) {
					editObj.drawOrder = obj.drawOrder; //暂不支持
					editObj.selectable = obj.selectable;
					editObj.editable = obj.editable;
					editObj.AltitudeType = parseInt(obj.Shadow);
				}

				editObj.SetControlPointArray(obj.vector3s);
				var linestyle = editObj.LineStyle;
				linestyle.LineWidth = obj.lineWidth;
				linestyle.LineColor = parseInt("0x" + obj.lineColor.toString().substring(1).toLowerCase());
				var fillstyle = editObj.FillStyle;
				fillstyle.FillColor = parseInt("0x" + obj.fillColor.toString().substring(1).toLowerCase());

				editObj.EndUpdate();
				earth.AttachObject(editObj);
				//军标旋转后直接修改了原始坐标 不用给rotation赋值
				setTransform(editObj, elementObj);
				attachObject(checked, editObj);
				userdataArr.push(editObj);
			} else if(obj.type === "fire" || obj.type === "mist" || obj.type === "fountain" || obj.type === "nozzle" || obj.type === "SprayNozzle" || obj.type === "Explosion" || obj.type === "WaterGunSmall") {
				var pType = 0;
				switch(obj.type) {
					case "fire":
						pType = 0;
						break;
					case "mist":
						pType = 1;
						break;
					case "fountain":
						pType = 2;
						break;
					case "nozzle":
						pType = 3;
						break;
					case "SprayNozzle":
						pType = 4;
						break;
					case "WaterGunSmall":
						pType = 5;
						break;
					case "Explosion":
						pType = 6;
						break;
					default:
						pType = 0;
						break;
				}

				var particle = earth.factory.CreateElementParticle(obj.id, obj.name);
				obj.guid = obj.id;
				//获取位置
				var pt = elementObj.getElementsByTagName("Position")[0].text.split(",");
				particle.SphericalTransform.SetLocationEx(pt[0], pt[1], pt[2]);
				particle.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				particle.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				particle.BeginUpdate();
				//火 = 0,  烟 = 1,  喷泉 = 2, 直流水枪 = 3,   喷雾水枪 = 4, 小水枪 = 5,  爆炸 = 6
				particle.Type = pType;
				particle.EndUpdate();
				if(pType == 6) {
					explosionObjs.push(particle);
				}
				earth.AttachObject(particle);
				setTransform(particle, elementObj);
				var checked = elementObj.getAttribute("checked");

				if(Number(checked) === 1) {
					particle.Visibility = true;
					particle.Selectable = true;
				} else {
					particle.Visibility = false;
					particle.Selectable = true;
				}
				userdataArr.push(particle);
			} else if(obj.type === "dWater") {
				var editObj = earth.Factory.CreateElementWater(obj.id, obj.name);
				var PointList = elementObj.getElementsByTagName("Coordinates");
				var polygon = null;
				if(PointList.length > 0 && PointList[0].text != "") {
					PointList = PointList[0].text;
					var vecs = PointList.split(" ");
					var v3s = earth.Factory.CreateVector3s();
					for(var k = 0; k < vecs.length; k++) {
						var v = vecs[k].split(",");
						var v3 = earth.Factory.CreateVector3();
						v3.X = v[0];
						v3.Y = v[1];
						v3.Z = v[2];
						v3s.AddVector(v3);
					}
					obj.vector3s = v3s;
					polygon = earth.factory.CreatePolygon();
					polygon.AddRing(obj.vector3s);
				}

				obj.guid = obj.id;
				var pt = elementObj.getElementsByTagName("Position")[0].text.split(",");
				editObj.SphericalTransform.SetLocationEx(pt[0], pt[1], pt[2]);
				editObj.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				editObj.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				editObj.BeginUpdate();
				if(polygon) {
					editObj.SetPolygon(polygon);
				}
				editObj.name = obj.name;
				editObj.EndUpdate();
				earth.AttachObject(editObj);
				setTransform(editObj, elementObj);
				userdataArr.push(editObj);
			} else if(Number(obj.type) === 220) { //初始化线条
				obj.lineColor = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				obj.drawOrder = elementObj.getElementsByTagName("DrawOrder")[0].text;
				obj.fillcolor = obj.fillColor;
				obj.linecolor = obj.lineColor;
				obj.arrow = elementObj.getElementsByTagName("isShadowArrow")[0].text;
				obj.shadow = elementObj.getElementsByTagName("ShadowType")[0].text;
				if(obj.shadow === '1') {
					if(elementObj.getElementsByTagName('ClampAltitudes').length > 0 && elementObj.getElementsByTagName('ClampAltitudes')[0].text != '') {
						obj.clampAltitudes = elementObj.getElementsByTagName('ClampAltitudes')[0].text;
					}
				}
				var Coordinates = elementObj.getElementsByTagName("Coordinates")[0].text;
				var vecs = Coordinates.split(" ");
				var v3s = earth.Factory.CreateVector3s();
				for(var j = 0; j < vecs.length; j++) {
					var v = vecs[j].split(",");
					var v3 = earth.Factory.CreateVector3();
					v3.X = v[0];
					v3.Y = v[1];
					v3.Z = v[2];
					v3s.AddVector(v3);
				}
				obj.vector3s = v3s;
				var visibility = elementObj.selectSingleNode("Visibility").text;
				var lineObj = earth.Factory.CreateElementLine(obj.id, obj.name);
				lineObj.BeginUpdate();
				lineObj.name = obj.name;
				lineObj.SetPointArray(obj.vector3s);
				lineObj.Visibility = true;
				var Linestyle = lineObj.LineStyle;
				Linestyle.LineWidth = obj.lineWidth;
				lineObj.ArrowType = obj.arrow;
				Linestyle.LineColor = parseInt("0x" + obj.lineColor.toString().substring(1).toLowerCase());
				if(typeof obj.clampAltitudes != 'undefined' && obj.clampAltitudes != null && obj.clampAltitudes != '') {
					setClampAltitude(lineObj, obj.clampAltitudes);
				}
				lineObj.AltitudeType = parseInt(obj.shadow);

				lineObj.selectable = elementObj.getElementsByTagName("Selectable")[0].text;
				lineObj.editable = elementObj.getElementsByTagName("Editable")[0].text;
				lineObj.drawOrder = obj.drawOrder;

				lineObj.EndUpdate();
				setTransform(lineObj, elementObj);
				earth.AttachObject(lineObj);
				attachObject(checked, lineObj);
				userdataArr.push(lineObj);
			} else if(Number(obj.type) === 245) { //多边形贴图 矩形贴图
				obj.shadow = elementObj.getElementsByTagName("ShadowType")[0].text;
				if(obj.shadow === '1') {
					if(elementObj.getElementsByTagName('ClampAltitudes').length > 0 && elementObj.getElementsByTagName('ClampAltitudes')[0].text != '') {
						obj.clampAltitudes = elementObj.getElementsByTagName('ClampAltitudes')[0].text;
					}
				}
				obj.expandX = elementObj.getElementsByTagName("TextureTiltX")[0].text;
				obj.expandY = elementObj.getElementsByTagName("TextureTiltY")[0].text;
				obj.picture = elementObj.getElementsByTagName("TextureImagePath")[0].text;
				obj.fillcolor = elementObj.getElementsByTagName("FillColor")[0].text;
				obj.linecolor = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				obj.textture = elementObj.getElementsByTagName("TextureMode")[0].text;

				var Coordinates = elementObj.getElementsByTagName("Coordinates")[0].text;

				var vecs = Coordinates.split(" ");
				var v3s = earth.Factory.CreateVector3s();
				for(var j = 0; j < vecs.length; j++) {
					var v = vecs[j].split(",");
					var v3 = earth.Factory.CreateVector3();
					v3.X = v[0];
					v3.Y = v[1];
					v3.Z = v[2];
					v3s.AddVector(v3);
				}
				obj.vector3s = v3s;
				var polygon = earth.Factory.CreateElementTexturePolygon(obj.id, obj.name);
				polygon.BeginUpdate();
				polygon.name = obj.name;
				polygon.SetExteriorRing(obj.vector3s);

				polygon.FillStyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				polygon.TextureImagePath = obj.picture;
				polygon.TextureMode = parseInt(obj.textture); //  0 无纹理        1 平铺纹理   2 拉伸（必须四个顶点）
				polygon.TextureTiltX = parseInt(obj.expandX); //  横向平铺重复次shu
				polygon.TextureTiltY = parseInt(obj.expandY); //  纵向平铺重复次shu

				polygon.LineStyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
				polygon.LineStyle.LineWidth = parseInt(obj.lineWidth);
				if(typeof obj.clampAltitudes != 'undefined' && obj.clampAltitudes != null && obj.clampAltitudes != '') {
					setClampAltitude(polygon, obj.clampAltitudes);
				}
				polygon.AltitudeType = parseInt(obj.shadow); // 0绝对 1贴地
				polygon.EndUpdate();
				setTransform(polygon, elementObj);
				earth.AttachObject(polygon);
				attachObject(checked, polygon);
				userdataArr.push(polygon);
			} else if(Number(obj.type) === 211) { //多边形
				obj.fillColor = elementObj.getElementsByTagName("FillColor")[0].text;
				obj.lineColor = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				//新增
				obj.perimeter = elementObj.getElementsByTagName("Perimeter")[0].text;
				obj.area = elementObj.getElementsByTagName("Area")[0].text;
				obj.drawOrder = elementObj.getElementsByTagName("DrawOrder")[0].text;

				obj.linecolor = obj.lineColor;
				obj.fillcolor = obj.fillColor;
				obj.shadow = elementObj.getElementsByTagName("ShadowType")[0].text;
				if(obj.shadow === '1' && elementObj.getElementsByTagName('ClampAltitudes').length > 0 && elementObj.getElementsByTagName('ClampAltitudes')[0].text != '') {
					obj.clampAltitudes = elementObj.getElementsByTagName('ClampAltitudes')[0].text;
				}
				var Coordinates = elementObj.getElementsByTagName("Coordinates")[0].text;
				var vecs = Coordinates.split(" ");
				var v3s = earth.Factory.CreateVector3s();
				for(var j = 0; j < vecs.length; j++) {
					var v = vecs[j].split(",");
					var v3 = earth.Factory.CreateVector3();
					v3.X = v[0];
					v3.Y = v[1];
					v3.Z = v[2];
					v3s.AddVector(v3);
				}
				obj.vector3s = v3s;
				var polygon = earth.Factory.CreateElementPolygon(obj.id, obj.name);
				polygon.BeginUpdate();
				polygon.name = obj.name;
				polygon.SetExteriorRing(obj.vector3s);
				polygon.FillStyle.FillColor = parseInt("0x" + obj.fillColor.toString().substring(1).toLowerCase());
				polygon.LineStyle.LineColor = parseInt("0x" + obj.lineColor.toString().substring(1).toLowerCase());

				polygon.LineStyle.LineWidth = obj.lineWidth;
				polygon.drawOrder = obj.drawOrder;
				if(typeof obj.clampAltitudes != 'undefined' && obj.clampAltitudes != null && obj.clampAltitudes != '') {
					setClampAltitude(polygon, obj.clampAltitudes);
				}
				polygon.AltitudeType = obj.shadow;
				polygon.Visibility = true;

				polygon.EndUpdate();
				setTransform(polygon, elementObj);
				earth.AttachObject(polygon);
				attachObject(checked, polygon);
				userdataArr.push(polygon);
			} else if(Number(obj.type) === 227) { //圆

				obj.Radius = elementObj.getElementsByTagName("Radius")[0].text;
				obj.fillcolor = elementObj.getElementsByTagName("FillColor")[0].text;
				obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				obj.lineColor = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.shadow = elementObj.getElementsByTagName("ShadowType")[0].text;
				//新增
				obj.perimeter = elementObj.getElementsByTagName("Perimeter")[0].text;
				obj.area = elementObj.getElementsByTagName("Area")[0].text;

				obj.selectable = elementObj.getElementsByTagName("Selectable")[0].text;
				obj.editable = elementObj.getElementsByTagName("Editable")[0].text;

				obj.guid = obj.id;
				obj.linecolor = obj.lineColor;
				var circle = earth.Factory.CreateElementCircle(obj.id, obj.name);
				circle.name = obj.name;
				var tran = circle.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				circle.BeginUpdate();
				circle.Radius = obj.Radius;

				circle.Selectable = obj.selectable;
				circle.Editable = obj.editable;
				circle.AltitudeType = obj.shadow;
				circle.FillStyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				circle.LineStyle.LineWidth = obj.lineWidth;
				circle.LineStyle.LineColor = parseInt("0x" + obj.lineColor.toString().substring(1).toLowerCase());
				circle.EndUpdate();
				earth.AttachObject(circle);
				setTransform(circle, elementObj);
				attachObject(checked, circle);
				userdataArr.push(circle);
			} else if(Number(obj.type) === 243) { //椭圆
				obj.fillcolor = elementObj.getElementsByTagName("FillColor")[0].text;
				obj.ShortRadius = elementObj.getElementsByTagName("ShortRadius")[0].text;
				obj.LongRadius = elementObj.getElementsByTagName("LongRadius")[0].text;
				obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				obj.lineColor = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.shadow = elementObj.getElementsByTagName("ShadowType")[0].text;
				//新增
				obj.perimeter = elementObj.getElementsByTagName("Perimeter")[0].text;
				obj.area = elementObj.getElementsByTagName("Area")[0].text;
				obj.drawOrder = elementObj.getElementsByTagName("DrawOrder")[0].text;

				obj.selectable = elementObj.getElementsByTagName("Selectable")[0].text;
				obj.editable = elementObj.getElementsByTagName("Editable")[0].text;

				obj.guid = obj.id;
				obj.linecolor = obj.lineColor;
				var ellipse = earth.Factory.CreateElementEllipse(obj.id, obj.name);
				ellipse.name = obj.name;
				var tran = ellipse.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				ellipse.BeginUpdate();
				ellipse.LongRadius = obj.LongRadius;
				ellipse.ShortRadius = obj.ShortRadius;
				ellipse.Selectable = obj.selectable;
				ellipse.Editable = obj.editable;

				var fillstyle = ellipse.FillStyle;
				fillstyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				ellipse.LineStyle.LineWidth = obj.lineWidth;
				ellipse.LineStyle.LineColor = parseInt("0x" + obj.lineColor.toString().substring(1).toLowerCase());
				ellipse.AltitudeType = obj.shadow;
				ellipse.EndUpdate();
				ellipse.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				ellipse.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				earth.AttachObject(ellipse);
				setTransform(ellipse, elementObj);
				attachObject(checked, ellipse);
				userdataArr.push(ellipse);
			} else if(Number(obj.type) === 228) {
				obj.fillcolor = elementObj.getElementsByTagName("FillColor")[0].text;
				obj.linecolor = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				var ArcCenterList = elementObj.getElementsByTagName("ArcCenter")[0].text.split(",");
				obj.Angle = elementObj.getElementsByTagName("Angle")[0].text;
				obj.radius = elementObj.getElementsByTagName("Radius")[0].text;
				obj.shadow = elementObj.getElementsByTagName("ShadowType")[0].text;
				//新增
				obj.perimeter = elementObj.getElementsByTagName("Perimeter")[0].text;
				obj.area = elementObj.getElementsByTagName("Area")[0].text;

				obj.selectable = elementObj.getElementsByTagName("Selectable")[0].text;
				obj.editable = elementObj.getElementsByTagName("Editable")[0].text;

				obj.guid = obj.id;
				obj.ArcCenter = earth.Factory.CreateVector3();
				obj.ArcCenter.X = ArcCenterList[0];
				obj.ArcCenter.Y = ArcCenterList[1];
				obj.ArcCenter.Z = ArcCenterList[2];
				var sector = earth.Factory.CreateElementSector(obj.id, obj.name);
				sector.name = obj.name;
				var tran = sector.SphericalTransform;
				tran.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				tran.SetScaleEx(scale[0], scale[1], scale[2]);
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				sector.BeginUpdate();
				sector.ArcCenter = obj.ArcCenter;
				sector.Angle = obj.Angle;
				sector.radius = obj.radius;
				sector.Selectable = obj.selectable;
				sector.Editable = obj.editable;
				sector.AltitudeType = obj.shadow;
				var fillstyle = sector.FillStyle;
				fillstyle.FillColor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				var sectorStyle = sector.LineStyle;

				sectorStyle.LineWidth = obj.lineWidth;
				sectorStyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());

				sector.EndUpdate();
				earth.AttachObject(sector);
				setTransform(sector, elementObj);
				attachObject(checked, sector);
				userdataArr.push(sector);
			} else if(Number(obj.type) === 229) {
				if(elementObj.getElementsByTagName("ShadowType")[0]) {
					obj.shadow = elementObj.getElementsByTagName("ShadowType")[0].text;
				};

				if(elementObj.getElementsByTagName("LineColor")[0]) {
					obj.linecolor = elementObj.getElementsByTagName("LineColor")[0].text;
				}

				if(obj.arrow = elementObj.getElementsByTagName("isShadowArrow")[0]) {
					obj.arrow = elementObj.getElementsByTagName("isShadowArrow")[0].text;
				}
				if(elementObj.getElementsByTagName("LineWidth") && elementObj.getElementsByTagName("LineWidth").length > 0) {
					obj.lineWidth = elementObj.getElementsByTagName("LineWidth")[0].text;
				}
				if(elementObj.getElementsByTagName("DrawOrder") && elementObj.getElementsByTagName("DrawOrder").length > 0) {
					obj.drawOrder = elementObj.getElementsByTagName("DrawOrder")[0].text;
				}

				var PointList;
				if(elementObj.getElementsByTagName("Coordinates")[0]) {
					PointList = elementObj.getElementsByTagName("Coordinates")[0].text;
					var vecs = PointList.split(" ");
					var v3s = earth.Factory.CreateVector3s();
					for(var k = 0; k < vecs.length; k++) {
						var v = vecs[k].split(",");
						var v3 = earth.Factory.CreateVector3();
						v3.X = v[0];
						v3.Y = v[1];
						v3.Z = v[2];
						v3s.AddVector(v3);
					}
					obj.vector3s = v3s;
				}

				obj.guid = obj.id;
				var curve = earth.Factory.CreateElementCurve(obj.id, obj.name);
				curve.name = obj.name;
				curve.BeginUpdate();
				if(obj.vector3s) {
					curve.SetControlPointArray(obj.vector3s);
				}
				var linestyle = curve.LineStyle;
				linestyle.LineWidth = obj.lineWidth;
				if(obj.linecolor) {
					linestyle.LineColor = parseInt("0x" + obj.linecolor.toString().substring(1).toLowerCase());
				}
				curve.AltitudeType = obj.shadow;
				if(obj.arrow) {
					curve.ArrowType = obj.arrow;
				}
				curve.drawOrder = obj.drawOrder;
				curve.EndUpdate();
				earth.AttachObject(curve);
				setTransform(curve, elementObj);
				attachObject(checked, curve);
				userdataArr.push(curve);
			} else if(Number(obj.type) === 216) {
				var texturePath = elementObj.getElementsByTagName("TexturePath");
				var texturePathCount = texturePath.length;
				var texturesArr = [];
				for(var j = 0; j < texturePathCount; j++) {
					texturesArr.push(texturePath[j].text);
				}
				obj.guid = obj.id;
				obj.textures = texturesArr;
				obj.texturePath = texturesArr;
				obj.Radius = elementObj.getElementsByTagName("Radius")[0].text;
				obj.selectable = elementObj.getElementsByTagName("Selectable")[0].text;
				obj.editable = elementObj.getElementsByTagName("Editable")[0].text;
				obj.objectFlagType = elementObj.getElementsByTagName("ObjectFlagType")[0].text;

				var fillcolor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				var radData = obj.Radius;
				var sphere = earth.Factory.CreateElementSphere(obj.id, obj.name);
				var tran = sphere.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				sphere.name = obj.name;
				sphere.BeginUpdate();
				sphere.Radius = obj.Radius;
				sphere.selectable = obj.selectable;
				sphere.editable = obj.editable;
				sphere.Underground = obj.objectFlagType;
				sphere.FillColor = fillcolor;
				sphere.Visibility = true;
				sphere.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				sphere.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				var materialStyles = sphere.MaterialStyles;
				var count = materialStyles.Count;
				for(var m = 0; m < count; m++) {
					var materialStyle = materialStyles.Items(m);
					materialStyle.DiffuseTexture = obj.textures[1];
				}
				sphere.EndUpdate();
				earth.AttachObject(sphere);
				setTransform(sphere, elementObj);
				attachObject(checked, sphere);
				userdataArr.push(sphere);
			} else if(Number(obj.type) === 202) { //立方体
				var texturePath = elementObj.getElementsByTagName("TexturePath");
				var texturePathCount = texturePath.length;
				var texturesArr = [];
				for(var j = 0; j < texturePathCount; j++) {
					texturesArr.push(texturePath[j].text);
				}
				obj.guid = obj.id;
				obj.textures = texturesArr;
				obj.texturePath = texturesArr;
				obj.widthValue = elementObj.getElementsByTagName("Width")[0].text;
				obj.longValue = elementObj.getElementsByTagName("Length")[0].text;
				obj.heightValue = elementObj.getElementsByTagName("Height")[0].text;

				var fillcolor = parseInt("0x" + obj.fillColor.toString().substring(1).toLowerCase());
				var visibility = true;
				var box = earth.Factory.CreateElementBox(obj.id, obj.name);
				box.name = obj.name;
				var tran = box.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				box.BeginUpdate();
				box.Width = obj.widthValue;
				box.Length = obj.longValue;
				box.Height = obj.heightValue;
				box.FillColor = fillcolor;
				box.Visibility = visibility;
				box.Name = obj.name;
				box.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				box.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				var materialStyles = box.MaterialStyles;
				var count = materialStyles.Count;
				for(var m = 0; m < count; m++) {
					var materialStyle = materialStyles.Items(m);
					materialStyle.DiffuseTexture = obj.textures[m];
				}
				box.EndUpdate();
				earth.AttachObject(box);
				setTransform(box, elementObj);
				attachObject(checked, box);
				userdataArr.push(box);
			} else if(Number(obj.type) === 207) { //立体多边形
				var texturePath = elementObj.getElementsByTagName("TexturePath");
				var texturePathCount = texturePath.length;
				var texturesArr = [];
				for(var j = 0; j < texturePathCount; j++) {
					texturesArr.push(texturePath[j].text);
				}
				obj.textures = texturesArr;
				obj.texturePath = texturesArr;
				obj.heightValue = elementObj.getElementsByTagName("Height")[0].text;
				var PointList = elementObj.getElementsByTagName("PointList")[0].text;
				var vecs = PointList.split(" ");
				var v3s = earth.Factory.CreateVector3s();
				for(var k = 0; k < vecs.length; k++) {
					var v = vecs[k].split(",");
					var v3 = earth.Factory.CreateVector3();
					v3.X = v[0];
					v3.Y = v[1];
					v3.Z = v[2];
					v3s.AddVector(v3);
				}
				obj.vector3s = v3s;
				obj.guid = obj.id;
				var fillcolor = parseInt("0x" + obj.fillColor.toString().substring(1).toLowerCase());
				var volume = earth.Factory.CreateElementVolume(obj.id, obj.name);
				volume.name = obj.name;
				setTransform(volume, elementObj);
				volume.BeginUpdate();
				volume.Underground = true;
				volume.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				volume.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				volume.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				volume.Height = obj.heightValue;
				volume.Visibility = true;
				volume.Vectors = obj.vector3s;
				volume.FillColor = fillcolor;
				var materialStyles = volume.MaterialStyles;
				var count = materialStyles.Count;
				for(var m = 0; m < count; m++) {
					var materialStyle = materialStyles.Items(m);
					materialStyle.DiffuseTexture = obj.textures[m];
				}
				volume.EndUpdate();
				earth.AttachObject(volume);
				attachObject(checked, volume);
				userdataArr.push(volume);
			} else if(Number(obj.type) === 203) { //圆柱
				var texturePath = elementObj.getElementsByTagName("TexturePath");
				var texturePathCount = texturePath.length;
				var texturesArr = [];
				for(var j = 0; j < texturePathCount; j++) {
					texturesArr.push(texturePath[j].text);
				}
				obj.guid = obj.id;
				obj.textures = texturesArr;
				obj.texturePath = texturesArr;
				obj.bottomRadius = elementObj.getElementsByTagName("Radius")[0].text;
				obj.heightValue = elementObj.getElementsByTagName("Height")[0].text;

				var fillcolor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				var cylinder = earth.Factory.CreateElementCylinder(obj.id, obj.name);
				cylinder.name = obj.name;
				var tran = cylinder.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				cylinder.BeginUpdate();
				cylinder.Radius = obj.bottomRadius;
				cylinder.Height = obj.heightValue;
				cylinder.Visibility = true;
				cylinder.FillColor = fillcolor;
				cylinder.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				cylinder.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				var materialStyles = cylinder.MaterialStyles;
				var count = materialStyles.Count;
				for(var m = 0; m < count; m++) {
					var materialStyle = materialStyles.Items(m);
					materialStyle.DiffuseTexture = obj.textures[m];
				}

				cylinder.EndUpdate();
				earth.AttachObject(cylinder);
				setTransform(cylinder, elementObj);
				attachObject(checked, cylinder);
				userdataArr.push(cylinder);
			} else if(Number(obj.type) === 204) { //圆锥
				var texturePath = elementObj.getElementsByTagName("TexturePath");
				var texturePathCount = texturePath.length;
				var texturesArr = [];
				for(var j = 0; j < texturePathCount; j++) {
					texturesArr.push(texturePath[j].text);
				}
				obj.guid = obj.id;
				obj.textures = texturesArr;
				obj.texturePath = texturesArr;
				obj.topRadius = elementObj.getElementsByTagName("TopRadius")[0].text;
				obj.bottomRadius = elementObj.getElementsByTagName("Radius")[0].text;
				obj.heightValue = elementObj.getElementsByTagName("Height")[0].text;

				var fillcolor = parseInt("0x" + obj.fillColor.toString().substring(1).toLowerCase());
				var radiusBottom = obj.BottomRadius;
				var radiusTop = obj.TopRadius;
				var height = obj.Height;
				var cone = earth.Factory.CreateElementCone(obj.id, obj.name);
				cone.name = obj.name;
				var tran = cone.SphericalTransform;

				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				cone.BeginUpdate();
				cone.BottomRadius = obj.bottomRadius;
				cone.TopRadius = obj.topRadius;
				cone.Height = obj.heightValue;
				cone.Visibility = true;
				cone.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				cone.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				cone.FillColor = fillcolor;
				var materialStyles = cone.MaterialStyles;
				var count = materialStyles.Count;
				for(var m = 0; m < count; m++) {
					var materialStyle = materialStyles.Items(m);
					materialStyle.DiffuseTexture = obj.textures[m];
				}
				cone.EndUpdate();
				earth.AttachObject(cone);
				setTransform(cone, elementObj);
				attachObject(checked, cone);
				userdataArr.push(cone);
			} else if(Number(obj.type) === 205) { //棱柱
				var texturePath = elementObj.getElementsByTagName("TexturePath");
				var texturePathCount = texturePath.length;
				var texturesArr = [];
				for(var j = 0; j < texturePathCount; j++) {
					texturesArr.push(texturePath[j].text);
				}
				obj.guid = obj.id;
				obj.textures = texturesArr;
				obj.texturePath = texturesArr;
				obj.bottomRadius = elementObj.getElementsByTagName("Radius")[0].text;
				obj.heightValue = elementObj.getElementsByTagName("Height")[0].text;
				obj.sides = elementObj.getElementsByTagName("Sides")[0].text;

				var fillcolor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase());
				var prism = earth.Factory.CreateElementPrism(obj.id, obj.name);
				prism.name = obj.name;
				var tran = prism.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				prism.BeginUpdate();
				prism.Radius = obj.bottomRadius;
				prism.Height = obj.heightValue;
				prism.Sides = obj.sides;
				prism.Visibility = true;
				prism.FillColor = fillcolor;
				prism.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				prism.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				var materialStyles = prism.MaterialStyles;
				var count = materialStyles.Count;
				for(var m = 0; m < count; m++) {
					var materialStyle = materialStyles.Items(m);
					materialStyle.DiffuseTexture = obj.textures[m];
				}

				prism.EndUpdate();
				earth.AttachObject(prism);
				setTransform(prism, elementObj);
				attachObject(checked, prism);
				userdataArr.push(prism);
			} else if(Number(obj.type) === 206) { //棱锥
				var texturePath = elementObj.getElementsByTagName("TexturePath");
				var texturePathCount = texturePath.length;
				var texturesArr = [];
				for(var j = 0; j < texturePathCount; j++) {
					texturesArr.push(texturePath[j].text);
				}
				obj.guid = obj.id;
				obj.textures = texturesArr;
				obj.texturePath = texturesArr;
				obj.topRadius = elementObj.getElementsByTagName("TopRadius")[0].text;
				obj.bottomRadius = elementObj.getElementsByTagName("BottomRadius")[0].text;
				obj.heightValue = elementObj.getElementsByTagName("Height")[0].text;
				obj.sides = elementObj.getElementsByTagName("Sides")[0].text;

				var fillcolor = parseInt("0x" + obj.fillColor.toString().substring(1).toLowerCase());
				var pyramid = earth.Factory.CreateElementPyramid(obj.id, obj.name);
				pyramid.name = obj.name;
				var tran = pyramid.SphericalTransform;
				tran.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				pyramid.BeginUpdate();

				pyramid.Sides = obj.sides;
				pyramid.BottomRadius = obj.bottomRadius;
				pyramid.TopRadius = obj.topRadius;
				pyramid.Height = obj.heightValue;
				pyramid.Visibility = true;
				pyramid.Name = obj.name;
				pyramid.FillColor = fillcolor;
				pyramid.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				pyramid.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				var materialStyles = pyramid.MaterialStyles;
				var count = materialStyles.Count;
				for(var m = 0; m < count; m++) {
					var materialStyle = materialStyles.Items(m);
					materialStyle.DiffuseTexture = obj.textures[m];
				}
				pyramid.EndUpdate();
				earth.AttachObject(pyramid);
				setTransform(pyramid, elementObj);
				attachObject(checked, pyramid);
				userdataArr.push(pyramid);
			} else if(Number(obj.type) === 223) { //模型
				obj.strLink = elementObj.getElementsByTagName("Link")[0].text;
				if(elementObj.getElementsByTagName("Tag").length > 0) {
					obj.tag = elementObj.getElementsByTagName("Tag")[0].text;
				} else {
					obj.tag = 3;
				}
				obj.link = obj.strLink;
				obj.guid = obj.id;
				var model = earth.Factory.CreateEditModelByLocal(obj.id, obj.name, obj.strLink, obj.tag);
				model.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				model.Name = obj.name;
				model.Selectable = true;
				model.Editable = true;
				earth.AttachObject(model);
				setTransform(model, elementObj);
				userdataArr.push(model);
			} else if(Number(obj.type) === 230) { //逃生路线
				obj.strLink = elementObj.getElementsByTagName("Link")[0].text;
				obj.tag = 1;
				obj.link = obj.strLink;
				obj.guid = obj.id;
				var model = earth.Factory.CreateEditModelByLocal(obj.guid, '', obj.strLink, 1);
				model.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				model.Name = obj.name;
				model.Selectable = true;
				model.Editable = true;
				earth.AttachObject(model);
				setTransform(model, elementObj);
				userdataArr.push(model);
			} else if(Number(obj.type) === 217) { //图片
				obj.width = elementObj.getElementsByTagName("Width")[0].text;
				obj.height = elementObj.getElementsByTagName("Height")[0].text;
				obj.imag = elementObj.getElementsByTagName("Icon")[0].text;
				obj.iconFileName = obj.imag;
				obj.guid = obj.id;
				var billboard = earth.Factory.CreateElementSimpleBillboard(obj.id, obj.name);
				billboard.name = obj.name;
				billboard.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				billboard.BeginUpdate();
				billboard.Width = Number(obj.width);
				billboard.Height = Number(obj.height);
				billboard.Image = obj.imag;
				billboard.Visibility = true;
				billboard.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				billboard.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				billboard.EndUpdate();
				setTransform(billboard, elementObj);
				earth.AttachObject(billboard);
				attachObject(checked, billboard);
				userdataArr.push(billboard);
			} else if(Number(obj.type) === 209) {
				var strIcon = elementObj.getElementsByTagName("Icon")[0].text;
				var strHightlightIcon = elementObj.getElementsByTagName("Icon")[1].text;
				obj.iconNormalFileName = strIcon;
				obj.guid = obj.id;
				obj.iconSelectedFileName = strHightlightIcon;
				var myicon = earth.Factory.CreateElementIcon(obj.id, obj.name);
				myicon.name = obj.name;
				myicon.LineSize = 7;
				myicon.Create(obj.longitude, obj.latitude, obj.altitude, strIcon, strHightlightIcon, obj.name);

				//新增属性
				myicon.textFormat = parseInt("0x100");
				var textColor = elementObj.getElementsByTagName("TextColor")[0].text;
				myicon.textColor = parseInt("0x" + textColor.toString().substring(1).toLowerCase());
				myicon.textHorizontalScale = elementObj.getElementsByTagName("TextHorizontalScale")[0].text;
				myicon.textVerticalScale = elementObj.getElementsByTagName("TextVerticalScale")[0].text;
				myicon.showHandle = elementObj.getElementsByTagName("ShowHandle")[0].text;
				myicon.handleHeight = elementObj.getElementsByTagName("HandleHeight")[0].text;
				var handleColor = elementObj.getElementsByTagName("HandleColor")[0].text;
				myicon.handleColor = parseInt("0x" + handleColor.toString().substring(1).toLowerCase());
				myicon.minVisibleRange = elementObj.getElementsByTagName("MinVisibleRange")[0].text;
				myicon.MaxVisibleRange = elementObj.getElementsByTagName("MaxVisibleRange")[0].text;
				myicon.selectable = elementObj.getElementsByTagName("Selectable")[0].text;
				myicon.editable = elementObj.getElementsByTagName("Editable")[0].text;

				myicon.Visibility = true;
				myicon.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				myicon.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				earth.AttachObject(myicon);
				setTransform(myicon, elementObj);
				attachObject(checked, myicon);
				userdataArr.push(myicon);
			} else if(Number(obj.type) === 280) {
				obj.floorHeight = elementObj.getElementsByTagName("FloorHeight")[0].text;
				obj.floorCount = elementObj.getElementsByTagName("FloorCount")[0].text;
				obj.roofType = elementObj.getElementsByTagName("RoofType")[0].text;
				obj.floorTexture = elementObj.getElementsByTagName("FloorTexture")[0].text;
				obj.roofTexture = elementObj.getElementsByTagName("RoofTexture")[0].text;
				obj.roofColor = elementObj.getElementsByTagName("RoofColor")[0].text;
				obj.floorColor = elementObj.getElementsByTagName("FloorColor")[0].text;
				var PointList = elementObj.getElementsByTagName("PointList")[0].text;
				var vecs = PointList.split(" ");
				var v3s = earth.Factory.CreateVector3s();
				for(var k = 0; k < vecs.length; k++) {
					var v = vecs[k].split(",");
					var v3 = earth.Factory.CreateVector3();
					v3.X = v[0];
					v3.Y = v[1];
					v3.Z = v[2];
					v3s.AddVector(v3);
				}
				obj.vector3s = v3s;
				obj.guid = obj.id;
				obj.roofTypeNode = obj.roofType;
				var simpleBuilding = earth.factory.CreateSimpleBuilding(obj.id, obj.name);
				simpleBuilding.name = obj.name;
				simpleBuilding.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				simpleBuilding.BeginUpdate();
				var polygon = earth.factory.CreatePolygon();
				polygon.AddRing(obj.vector3s);
				simpleBuilding.SetPolygon(0, polygon);
				var floorCount = parseInt(obj.floorCount);
				var floorHeight = parseFloat(obj.floorHeight);
				simpleBuilding.SetFloorsHeight(obj.floorHeight * obj.floorCount);
				simpleBuilding.SetFloorHeight(obj.floorHeight);
				simpleBuilding.SetRoofType(obj.roofType);
				var roofcolor = parseInt("0x" + obj.roofColor.toString().substring(1).toLowerCase());
				var floorcolor = parseInt("0x" + obj.floorColor.toString().substring(1).toLowerCase());
				simpleBuilding.FloorsColor = floorcolor;
				simpleBuilding.RoofColor = roofcolor;
				var floorMats = simpleBuilding.GetFloorsMaterialStyles();
				floorMats.Items(0).DiffuseTexture = obj.roofTexture;
				floorMats.Items(1).DiffuseTexture = obj.roofTexture;
				for(var m = 2; m < floorMats.Count; m++) {
					floorMats.Items(m).DiffuseTexture = obj.floorTexture;
				}
				var roofMats = simpleBuilding.GetRoofMaterialStyles();
				roofMats.Items(1).DiffuseTexture = obj.roofTexture;
				simpleBuilding.SphericalTransform.SetRotationEx(rotation[0], rotation[1], rotation[2]);
				simpleBuilding.SphericalTransform.SetScaleEx(scale[0], scale[1], scale[2]);
				simpleBuilding.EndUpdate();
				earth.AttachObject(simpleBuilding);

				setTransform(simpleBuilding, elementObj);
				attachObject(checked, simpleBuilding);
				userdataArr.push(simpleBuilding);
			} else if(Number(obj.type) === 244) {
				if(EditLayer === null) {
					createLayer();
				}
				obj.guid = obj.id;
				obj.path = elementObj.getElementsByTagName("Link")[0].text;
				obj.height = elementObj.getElementsByTagName("Height")[0].text;
				var grid = earth.Factory.CreateElementGrid(obj.id, obj.name, obj.path, obj.height /*高度2千米*/ );
				grid.name = obj.name;
				grid.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				EditLayer.BeginUpdate();
				earth.AttachObject(grid);
				if(Number(checked) === 1) {
					grid.Visibility = true;
				} else {
					grid.Visibility = false;
				}

				EditLayer.EndUpdate();
				setTransform(grid, elementObj);
				userdataArr.push(grid);
			} else if(Number(obj.type) === 210) {
				obj.color = elementObj.getElementsByTagName("LineColor")[0].text;
				obj.radius = elementObj.getElementsByTagName("Radius")[0].text;
				obj.segment = elementObj.getElementsByTagName("Segment")[0].text;

				var sphere = earth.Factory.CreateSignalSphere(obj.guid, obj.name);
				sphere.BeginUpdate();
				sphere.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
				sphere.Radius = obj.radius;
				sphere.Segment = obj.segment;
				sphere.LineStyle.LineColor = parseInt("0x" + obj.color.substring(1).toLowerCase());
				sphere.EndUpdate();
				earth.AttachObject(sphere);
				setTransform(sphere, elementObj);
				attachObject(checked, sphere);
				userdataArr.push(sphere);
			} else if(obj.type == "cordon") {
				//警戒线初始化
				var ObjPathUsb = elementObj.getElementsByTagName("ObjPathUsb")[0].text;

				var model = earth.Factory.CreateEditModelByLocal(obj.guid, obj.name, ObjPathUsb, 1);
				model.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);

				model.name = obj.name;
				model.Selectable = true;
				model.Editable = true;
				earth.AttachObject(model);

				setTransform(model, elementObj);
				attachObject(checked, model);
				userdataArr.push(model);
			}
		}

		if(explosionObjs.length > 0) {
			setTimeout(function() {
				for(var i = 0; i < explosionObjs.length; i++) {
					var explosionFlag = earth.Factory.CreateGuid(); //唯一标识
					dictionaryExplosion[explosionObjs[i].guid] = explosionFlag;
					_beginExplosion(explosionObjs[i], explosionTimes - 1, explosionFlag);
				}
			}, explosionTimeOut);
		}

		return userdataArr;
	};

	/**
	 * 根据node id得到节点数据并定位
	 */
	var _flyto = function(dataDoc, nodeId) {
		var elements = dataDoc.getElementsByTagName("Element");
		var editObj = _getElementByID(nodeId);

		for(var i = 0; i < elements.length; i++) {
			var id = elements[i].getAttribute("id");
			var type = elements[i].getAttribute("type");
			if(nodeId === id) {
				var lon = elements[i].getElementsByTagName("Longitude")[0].nodeTypedValue;
				var lat = elements[i].getElementsByTagName("Latitude")[0].nodeTypedValue;
				var alt = elements[i].getElementsByTagName("Altitude")[0].nodeTypedValue;
				var heading = elements[i].getElementsByTagName("Heading")[0].nodeTypedValue;
				var tilt = elements[i].getElementsByTagName("Tilt")[0].nodeTypedValue;
				var range = elements[i].getElementsByTagName("Range")[0].nodeTypedValue;
				var roll = 0;
				var time = 6;
				if(type === "244") { //晕染图单独处理
					var grid;
					for(var k = 0; k < userdataArr.length; k++) {
						var eobj = userdataArr[k];
						if(eobj && eobj.guid == nodeId) {
							grid = eobj;
						}
					}
					earth.GlobeObserver.FlytoLookat(grid.CenterLocation.X, grid.CenterLocation.Y, grid.CenterLocation.Z, 0, 90, 0, 500, time);
				} else {
					earth.GlobeObserver.FlytoLookat(lon, lat, alt, heading, tilt, roll, range, time);
				}
			}
		}
		if(editObj && editObj.Visibility == true) {
			if(editObj.Rtti == 209) { //POI
				currentHighlightObj = editObj;
				blinkElementObject(editObj, 0, 0);
			} else {
				editObj.ShowHighLight();
			}
		}
	};
	/**
	 * 闪烁双击定位的对象
	 */
	var blinkElementObject = function(obj, counter, control_box) {
		if(obj == null || obj.guid != currentHighlightObj.guid) {
			return;
		}
		if(counter <= 10) {
			if(control_box == 0) {
				obj.Visibility = false;
				control_box = 1;
			} else {
				obj.Visibility = true;
				control_box = 0;
			}
			setTimeout(function() {
				counter++;
				blinkElementObject(obj, counter, control_box);
			}, 1000);
		} else {
			obj.Visibility = true;
		}
	}
	//编辑用户数据
	function _editUserdataClicked(nodeId) {
		//保存到本地XML
		var nodeName = _editUserNode(nodeId, filename);
		return nodeName;
	}

	//删除文件夹-共三级菜单调用
	function _deleteTreeFolder(nodeId) {
		//根据guid移除地球上的显示对象
		removeObjFromEarth(nodeId);
		//同步数据到本地xml文件
		deleteFolder(nodeId);
	}
	/**
	 * 删除所有
	 */
	function removeAllFromEarth() {
		if(userdataArr && userdataArr.length > 0) {
			for(var i = 0; i < userdataArr.length; i++) {
				earth.DetachObject(userdataArr[i]);
			}
		}
		//清空数组
		userdataArr = [];
		earth.ToolManager.SphericalObjectEditTool.Browse();
	};

	function deleteAllXML() {
		var rootxml = getUserdata(filename);
		var childs = rootxml.getElementsByTagName("ElementDocument")[0].childNodes;
		//移除folder并且移除内部的各个子节点
		var folderElements = rootxml.getElementsByTagName("ElementFolder");
		var elements = rootxml.getElementsByTagName("Element");

		for(var i = 0; i < elements.length; i++) {
			elements[i].parentNode.removeChild(elements[i]);
		}

		for(var i = 0; i < folderElements.length; i++) {
			folderElements[i].parentNode.removeChild(folderElements[i]);
		}

		var path = earth.Environment.RootPath + "userdata\\" + filename;
		earth.UserDocument.saveXmlFile(path, rootxml.xml);
	};

	/**
	 * 删除文件夹的时候 从地球上移除文件夹下的所有对象
	 * @param  {[type]} nodeId [description]
	 * @return {[type]}      [description]
	 */
	function removeObjFromEarth(nodeID) {
		//清除earth上对应的要素
		earth.ShapeCreator.Clear();
		var rootxml = getUserdata(filename);
		var list = getElementsByFolder(rootxml, nodeID);
		if(list && list.length) {
			for(var i = list.length - 1; i >= 0; i--) {
				var elementObj = _getElementByID(list[i]);
				earth.DetachObject(elementObj);
				earth.ToolManager.SphericalObjectEditTool.Browse();
			};
		}
	};

	/**
	 * 同步数据到本地xml文件
	 * @param  {[type]} nodeId [description]
	 * @return {[type]}      [description]
	 */
	function deleteFolder(nodeId) {
		_deleteUserNode(nodeId, filename);

	};

	//删除节点事件
	function _deleteUserdataNode(nodeId) {
		//根据id删除对应的element并同步到本地的xml文件
		_deleteUserNode(nodeId, filename);
		//清除earth上对应的要素 这里貌似不起作用啊 删除不了动态对象
		earth.ShapeCreator.Clear();
		deleteFromEarth(nodeId);
		//从对象数组中清除该对象
		removeFromUserdata(userdataArr, nodeId);
	}

	function _deleteTreeNode(nodeId) {
		//根据id删除对应的element并同步到本地的xml文件
		_deleteUserNode(nodeId, filename);
		//清除earth上对应的要素 这里貌似不起作用啊 删除不了动态对象
		earth.ShapeCreator.Clear();
		deleteFromEarth(nodeId);
		//从对象数组中清除该对象
		removeFromUserdata(userdataArr, nodeId);
	}

	/**
	 * 移除
	 * @param {Object} array  数组
	 * @param {Object} id  id
	 */
	var removeFromUserdata = function(array, id) {
		for(var i = array.length - 1; i >= 0; i--) {
			if(array[i].guid === id) {
				array.splice(i, 1);
			}
		};
	}

	//从Earth上删除对象
	function deleteFromEarth(guid) {
		if(userdataArr && userdataArr.length) {
			for(var i = userdataArr.length - 1; i >= 0; i--) {
				if(userdataArr[i].guid === guid) {
					// 清除对象之前先清除定时器
					if(userdataArr[i].Type == 6) {
						clearTimer(guid);
					}
					earth.DetachObject(userdataArr[i]);
					//todo:如果该对象是选中状态的时候 怎么清除选中框呢? 暂时都清除了
					earth.ToolManager.SphericalObjectEditTool.Browse();
				}
			};
		}
	}

	var originID = 1;
	var originPID = 0;
	var ID = 0;
	var treeData = [];
	var initTree = function(userdataTree) {
		var userTreeData;
		userDataDoc = userdata.getUserdata(filename);
		userTreeData = getElementsList(userDataDoc, "ElementDocument", originID, originPID);
		_initDataArr(filename);
	};

	/**
	 *   递归遍历XML节点生成一个数组 数组内部都是json格式的数据 用来直接传递给JQuery里的zTree对象
	 *   @param  {String} xml 表示传入的xml数据
	 *   @param  {String} rootName 表示开始遍历的节点名称
	 *   @return {String} 返回[{...}]格式的数组数据
	 */
	function getElementsList(xml, rootName, originID, originPID) {
		var list = xml.documentElement.getElementsByTagName(rootName);
		var id = list[0].getAttribute("id");
		var checked = list[0].getAttribute("checked");
		var open = list[0].getAttribute("open");
		var length = list.length;

		if(Number(checked) === 1) {
			checked = true;
		} else {
			checked = false;
		}

		var json = {
			id: id,
			pId: 0,
			name: treeRootName,
			checked: checked,
			open: open,
			isParent: true
		};
		treePIDObject[id] = 0;
		treeData.push(json);

		for(var t = 0; t < length; t++) {
			var x = list[t].childNodes;
			//传入ElementDocument所有子节点
			recursion(x, id, originPID);
		}
		return treeData;
	};
	/**
	 * 通过对象的type来取得图标
	 * @param  {[string]}  type        [该对象的type，可能为数据和字符串]
	 * @param  {Boolean} isThreeMenu [是否是属于第三级菜单里面的ztree会影响到图片路径]
	 * @return {[string]}              [返回图片的相对路径]
	 */
	function getUserdataIcon(type, isThreeMenu) {
		if(isThreeMenu) {
			var iconPath = "../../images/userdata/"

		} else {
			var iconPath = "images/userdata/"

		}
		switch(type) {
			case "fire":
				iconPath += "fire.png";
				break;
			case "mist":
				iconPath += "mist.png";
				break;
			case "Explosion":
				iconPath += "Explosion.png";
				break;
			case "SprayNozzle":
				iconPath += "SprayNozzle.png";
				break;
			case "nozzle":
				iconPath += "nozzle.png";
				break;
			case "fountain":
				iconPath += "fountain.png";
				break;
			case "WaterGunSmall":
				iconPath += "WaterGunSmall.png";
				break;
			case "dWater":
				iconPath += "dWater.png";
				break;
			case "209":
				iconPath += "point.png";
				break;
			case "220":
				iconPath += "line.png";
				break;
			case "229":
				iconPath += "curve.png";
				break;
			case "211":
				iconPath += "polygon.png";
				break;
			case "227":
				iconPath += "circle.png";
				break;
			case "243":
				iconPath += "ellipse.png";
				break;
			case "228":
				iconPath += "sector.png";
				break;
			case "245":
				iconPath += "texturePolygon.png";
				break;
			case "216":
				iconPath += "sphere.png";
				break;
			case "202":
				iconPath += "box.png";
				break;
			case "207":
				iconPath += "volume.png";
				break;
			case "203":
				iconPath += "cylinder.png";
				break;
			case "204":
				iconPath += "cone.png";
				break;
			case "205":
				iconPath += "prism.png";
				break;
			case "206":
				iconPath += "pyramid.png";
				break;
			case "210":
				iconPath += "signalSphere.png";
				break;
			case "280":
				iconPath += "building.png";
				break;
			case "cordon":
				iconPath += "cordon.png";
				break;
			case "223":
				iconPath += "model.png";
				break;
			case "217":
				iconPath += "picture.png";
				break;
			case "250":
				iconPath += "sArrow.png";
				break;
			case "253":
				iconPath += "sArrow.png";
				break;
			case "252":
				iconPath += "tailSArrow.png";
				break;
			case "254":
				iconPath += "tailSArrow.png";
				break;
			case "251":
				iconPath += "equalSArrow.png";
				break;
			case "255":
				iconPath += "doubleArrow.png";
				break;
			case "256":
				iconPath += "xArrow.png";
				break;
			case "260":
				iconPath += "assemblyArea.png";
				break;
			case "259":
				iconPath += "curveFlag.png";
				break;
			case "258":
				iconPath += "rightAngleFlag.png";
				break;
			case "257":
				iconPath += "triangleFlag.png";
				break;
			default:
				iconPath += "files.png";
		}
		return iconPath;
	}

	/**
	 * 递归算法
	 * @param  {[type]} x         [description]
	 * @param  {[type]} originID  [description]
	 * @param  {[type]} originPID [description]
	 * @return {[type]}           [description]
	 */
	function recursion(x, originID, originPID) {
		for(var i = 0, max = x.length; i < max; i++) {
			var element = x[i];
			var name = element.nodeName;

			var nName = element.getAttribute("name");
			var nID = element.getAttribute("id");
			var checked = element.getAttribute("checked");
			var open = element.getAttribute("open");
			var elementType = element.getAttribute("type");

			var iconPath = getUserdataIcon(elementType);

			if(Number(checked) === 1) {
				checked = true;
			} else {
				checked = false;
			}

			if(name == "Element") {
				var json = {
					id: nID,
					pId: originID,
					name: nName,
					checked: checked,
					open: open,
					icon: iconPath
				};
				treeData.push(json);
			}

			if(name == "ElementFolder" && element.childNodes) {
				var json = {
					id: nID,
					pId: originID,
					name: nName,
					checked: checked,
					open: open,
					isParent: true
				};
				treeData.push(json);

				recursion(element.childNodes, nID, nID);
			}
		}
	}

	function _zTreeGetNode(nodeId, bChecked) {
		zTreeOnCheck(nodeId, bChecked);
	}

	//用于捕获 checkbox / radio 被勾选 或 取消勾选的事件回调函数
	function zTreeOnCheck(nodeId, bChecked) {
		setElementChecked(nodeId, bChecked);
	};

	/**
	 *  设置节点的是否勾选状态
	 */
	function setElementChecked(guid, checked) {
		//设置
		var rootxml = getUserdata(filename);
		//这里取出来的是节点
		var element = getElementByGUID(rootxml, guid);
		//这里取出来的是地球上的对象(都是Element)
		var sElement = _getElementByID(guid);
		//ture记为1 flase记为0
		if(checked) {
			checked = 1;
			if(sElement) {
				sElement.Visibility = true;
				sElement.Selectable = true;
			}

		} else {
			checked = 0;
			if(sElement) {
				sElement.Visibility = false;
				sElement.Selectable = false;
			}
		}
		//获取该element对应的所有的父节点对象 并设置check
		getFolderByGuid(rootxml, guid, checked);
		if(element) { //todo:根节点的状态还未保存
			//保存
			var root = earth.Environment.RootPath + "userdata\\" + filename;
			earth.UserDocument.saveXmlFile(root, rootxml.xml);
		}
	};

	/**
	 * 获取该element对应的所有的父节点对象
	 * 当check的时候 这些父对象也对应修改节点的check属性值 并保存到本地
	 * @param  {[type]} guid [description]
	 * @return {[type]}      [description]
	 */
	function getFolderByGuid(rootxml, guid, checked) {
		var treeNode = getElementByGUID(rootxml, guid);
		if(treeNode) {
			treeNode.getAttributeNode("checked").nodeValue = checked;
		}
	};
	/**
	 * 根据folder文件夹ID来获取其子节点的所有ID
	 * @param  {[type]} rootxml [description]
	 * @param  {[type]} guid    [description]
	 * @return {[type]}         [description]
	 */
	function getElementsByFolder(rootxml, guid) {
		var element = getElementByGUID(rootxml, guid);
		if(element) {
			var type = element.getAttribute("type");
			if(type === "folder") {
				//如果是文件夹 则返回多个下面所有的element的guid
				var elementList = element.getElementsByTagName("Element");
				var list = [];
				for(var i = 0, max = elementList.length; i < max; i++) {
					list.push(elementList[i].getAttribute("id"));
				}
				return list;
			}
		}
	};

	//显示Element到Earth上
	function showElement(guid) {};
	//隐藏Element在Earth上
	function hideElement(guid) {};

	//插入节点到目标节点后面
	function insertAfter(newElement, targetElement) {
		var parent = targetElement.parentNode;
		if(parent.lastChild == targetElement) {
			parent.appendChild(newElement);
		} else {
			parent.insertBefore(newElement, targetElement.nextSibling);
		}
	}

	var getElementByGUID = function(xml, guid) {
		//根节点
		var rootNode = xml.getElementsByTagName("ElementDocument")[0];
		var id = rootNode.getAttribute("id");
		//允许通过其guid或者pid(0)来获取根节点节点
		if(id === guid) {
			return rootNode;
		}
		var elements = xml.getElementsByTagName('Element');
		var elementFolder = xml.getElementsByTagName('ElementFolder');

		for(var i = 0; i < elements.length; i++) {
			var elementGUID = elements[i].getAttribute("id");
			if(elementGUID == guid) {
				return elements[i];
			}
		}

		for(var i = 0; i < elementFolder.length; i++) {
			var elementFolderGUID = elementFolder[i].getAttribute("id");
			if(elementFolderGUID == guid) {
				return elementFolder[i];
			}
		}
	}

	/**
	 * [getElementByType 根据对象类型来返回对象 如多边形的  211 面 220 线条]
	 * @param  {[type]} xml  [description]
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	function getElementByType(xml, type) {
		var returnType = [];
		var elements = xml.getElementsByTagName('Element');

		for(var i = 0; i < elements.length; i++) {
			var elementType = elements[i].getAttribute("type");
			if(elementType === type || Number(elementType) === type) {
				returnType.push(elements[i]);
			}
		}
		return returnType;
	}

	//根据传入的GUID获取对应的xml节点 针对子节点拖拽到父节点
	function getElementFromGUID(xml, removeGUID, targetGUID) {
		var nodes = [];
		//遍历每一个Element节点
		var elements = xml.getElementsByTagName('Element');
		//遍历每一个ElementFolder节点
		var elementFolder = xml.getElementsByTagName('ElementFolder');

		for(var i = 0; i < elements.length; i++) {
			var elementGUID = elements[i].getAttribute("id");
			if(elementGUID == removeGUID) {
				nodes.push({
					"remove": elements[i]
				});
			} else if(elementGUID == targetGUID) {
				nodes.push({
					"target": elements[i]
				});
			}
		}

		for(var i = 0; i < elementFolder.length; i++) {
			var elementFolderGUID = elementFolder[i].getAttribute("id");
			if(elementFolderGUID == removeGUID) {
				nodes.push({
					"remove": elementFolder[i]
				});
			} else if(elementFolderGUID == targetGUID) {
				nodes.push({
					"target": elementFolder[i]
				});
			}
		}
		return nodes;
	}
	var innerTree = function(treeId, treeNodes, targetNode) {
		//当文件夹里没有子节点的时候 默认不处理 文件夹图标变为子节点图标 不做删除操作
		if(treeNodes && treeNodes[0]) {
			var parent = treeNodes[0].getParentNode();
			if(parent && parent.children && parent.children.length == 1) {
				var treeN = treeNodes[0].getParentNode();
			}
		}

		return targetNode != null && targetNode.isParent;
	}

	var _addElementFromOuter = function(element) {
		if(userdataArr) {
			userdataArr.push(element);
		}
	}

	/**
	 * 通过延时来实现连续爆炸
	 * @param  {[type]} particle [爆炸动态对象]
	 * @param  {[type]} times    [爆炸次数]
	 * @param  {[type]} flag     [爆炸动态对象对应唯一标识，主要用于：当该爆炸对象还在循环爆炸时，重新开始爆炸需要把之前延时器给关闭掉]
	 * @return {[type]}          [description]
	 */
	function _beginExplosion(particle, times, flag) {
		if(!particle.Visibility || times <= 0 || dictionaryExplosion[particle.guid] != flag) { //判断当前爆炸对象标识与缓存中正在爆炸的对象标识是否相等，不相等说明爆炸对象已经重新开始了，直接返回掉
			return;
		}
		//定时器编号
		var timer = setTimeout(function() {
			particle.BeginUpdate();
			particle.EndUpdate();
			_beginExplosion(particle, times - 1, flag);
		}, explosionTimeOut);
		timerAll[particle.guid] = timerAll[particle.guid] || [];
		timerAll[particle.guid].push(timer);
	}
	/**
	 * [_clearTimer 清除延时器]
	 * @return {[type]} [无]
	 */
	function clearTimer(guid) {
		for(var i = 0, length = timerAll[guid].length; i < length; i++) {
			clearTimeout(timerAll[guid][i])
		}
		delete timerAll[guid];
	}
	/**
	 * 根据对象GUID，找到Element对象
	 * @param  {[type]} guid [description]
	 * @return {[type]}      [description]
	 */
	var _getUserdataByGuid = function(guid) {
		var userDataObj = null;
		for(var i = 0; i < userdataArr.length; i++) {
			if(userdataArr[i].guid == guid) {
				userDataObj = userdataArr[i];
				break;
			}
		}
		return userDataObj;
	}

	/**
	 * 获取爆炸字典，主要用于控制爆炸对象重新开始爆炸
	 * @return {[type]} [description]
	 */
	var _getDictionaryExplosion = function() {
		return dictionaryExplosion;
	}

	userdata.initDataArr = _initDataArr
	userdata.createPrimitives = _createPrimitives;
	userdata.createParticle = _createParticle;
	userdata.importModelData = _importModelData;
	userdata.createMilitaryTag = _createMilitaryTag;
	userdata.getUserdata = getUserdata;
	userdata.flyto = _flyto;
	userdata.deleteUserNode = _deleteUserNode;
	userdata.editUserNode = _editUserNode;
	userdata.addElementFromOuter = _addElementFromOuter;
	userdata.select = _select;
	userdata.group = _group;
	userdata.ungroup = _ungroup;
	userdata.move = _move;
	userdata.rotate = _rotate;
	userdata.scale = _scale;
	userdata.moveByValue = _moveByValue;
	userdata.rotateByValue = _rotateByValue;
	userdata.scaleByValue = _scaleByValue;
	userdata.alignGround = _alignGround;
	userdata.clearObj = clearObj;
	userdata.editpoint = _editpoint;
	userdata.deletepoint = _deletepoint;
	userdata.addpoint = _addpoint;
	userdata.SegmentExtrude = _SegmentExtrude;
	userdata.VolumeSegmentExtrude = _VolumeSegmentExtrude;
	userdata.clone = _clone;
	userdata.delObj = _delObj;
	userdata.save = _save;
	userdata.initTree = initTree;
	userdata.loadXMLStr = loadXMLStr;
	userdata.getElementByType = getElementByType;
	userdata.getElementByGUID = getElementByGUID;
	userdata.updateTree = updateTree;
	userdata.createElement = createElement; //添加接口方法存储数据
	userdata.createSignalSphere = _createSignalSphere; //创建信号辐射球
	userdata.zTreeGetNode = _zTreeGetNode;
	userdata.editUserdataClicked = _editUserdataClicked;
	userdata.deleteUserdataNode = _deleteUserdataNode;
	userdata.deleteTreeNode = _deleteTreeNode;
	userdata.deleteTreeFolder = _deleteTreeFolder;
	userdata.getUserdataIcon = getUserdataIcon;
	userdata.hideWindScene = hideWindScene; //清除风场属性气泡
	userdata.getUserdataByGuid = _getUserdataByGuid;
	userdata.beginExplosion = _beginExplosion;
	userdata.getDictionaryExplosion = _getDictionaryExplosion;
	return userdata;
}