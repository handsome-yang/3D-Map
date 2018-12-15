/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月8日
 * 描    述：三维分析功能
 * 注意事项：存放所有三维分析模块里面的功能方法
 * 遗留bug ：无
 * 修改日期：2018年03月26日
 */
var bolonArr = []; //气泡数组
var htmlBalloonMove = null; //分析功能气泡
var AnalineObj = null; //分析中创建的结果对象
var floorLineObjArr = []; //楼间距结果对象数组
var SurfaceAreaResult = null; //量算结果
var lastId = null; //上一次点击的菜单ID
var submergePolygon = null; //淹没分析结果对象

if(!STAMP) {
	var STAMP = {};
}

STAMP.Analysis = function(earth) {
	var analysis = {};
	var _result = null; // 分析结果
	var _tempLayer = null; // 临时地形图层
	var _tempModel = null; // 临时填挖模型
	var extent = null; //阴影分析中绘制的范围点
	var viewShedObj = null; //创建的视锥体
	var resArr = []; //分析结果数组

	//通视分析定义变量
	var ares = []; //所有通视分析结果集合
	var elementLines = []; //通视分析生成的线数组
	var pointIcons = []; //通视分析生成的起始点目标点字样
	var sel_line = null; //显示高度时选中线

	var lightSightRes = []; //沿路通视结果

	/**
	 * 清除结果
	 * @return {[type]} [description]
	 */
	var clear = function() {
		if(earth === "" || earth === undefined) {
			return;
		}
		earth.ShapeCreator.Clear();
		earth.Measure.Clear();
		// earth.TerrainManager.ClearTempLayer();

		if(bolonArr.length > 0) {
			while(bolonArr.length > 0) {
				var b = bolonArr.pop();
				if(b) {
					b.DestroyObject();
				}
			}
			if(SurfaceAreaResult) {
				SurfaceAreaResult.ClearRes();
				SurfaceAreaResult = null;
			}
		}
		bolonArr = [];

		if(AnalineObj) {
			earth.DetachObject(AnalineObj);
			AnalineObj = null;
		}

		if(floorLineObjArr && floorLineObjArr.length > 0) {
			for(var i = 0; i < floorLineObjArr.length; i++) {
				if(floorLineObjArr[i]) {
					earth.DetachObject(floorLineObjArr[i]);
				}
			}
		}
		floorLineObjArr = [];

		if(_result) {
			_result.ClearRes();
			_result = null;
		}
		if(_tempLayer) {
			earth.DetachObject(_tempLayer);
			_tempLayer = null;
		}
		if(_tempModel) {
			earth.DetachObject(_tempModel);
			_tempModel = null;
		}

		//清除通视分析
		if(elementLines) {
			for(var i = 0; i < elementLines.length; i++) {
				earth.DetachObject(elementLines[i]);
			}
			elementLines = [];
		}
		if(pointIcons) {
			for(var i = 0; i < pointIcons.length; i++) {
				earth.DetachObject(pointIcons[i]);
			}
			pointIcons = [];
		}

		//清除沿路通视
		if(lightSightRes.length != 0) {
			for(var i = 0; i < lightSightRes.length; i++) {
				lightSightRes[i].ClearRes();
			}
			lightSightRes = [];
		}

		//清除视域分析的视锥体
		if(viewShedObj) {
			earth.DetachObject(viewShedObj);
			viewShedObj = null;
		}

		//淹没分析结果清除
		if(submergePolygon) {
			earth.DetachObject(submergePolygon);
			submergePolygon = null;
		}
	};

	/**
	 * 在球上以HtmlBalloon的形式显示测量结果
	 */
	var _showMeasureResult = function(result) {
		var bc = '#f4faff';
		var c = top.SYSTEMPARAMS.balloonAlpha > 0 ? '#FFFFFE' : '#0075C8';
		var html = "<html><body style='color: " + c + "; font-weight: bold; margin: 0; padding: 2px;'><p style='text-align:center;margin-top:30px;]'>" +
			result + "</p></body></html>";
		var id = earth.Factory.CreateGuid();
		var htmlBal = earth.Factory.CreateHtmlBalloon(id, "量算窗体");

		htmlBal.SetIsAddCloseButton(true);
		htmlBal.SetIsAddMargin(true);
		htmlBal.SetIsAddBackgroundImage(true);
		if(top.SYSTEMPARAMS.balloonAlpha > 0) {
			htmlBal.SetIsTransparence(true);
			htmlBal.SetRectSize(290, 150);
			htmlBal.SetBackgroundAlpha(0);
			htmlBal.SetScreenLocation(290 / 2 + 80, 0);
		} else {
			htmlBal.SetIsTransparence(false);
			htmlBal.SetScreenLocation(340 / 2 + 80, -20);
			htmlBal.SetRectSize(340, 150);
		}

		htmlBal.ShowHtml(html);
		bolonArr.push(htmlBal);
	};

	/*************************************通视分析 START*****************************************/
	/**
	 * 创建通视线
	 * @param  {[type]} vec3s [description]
	 * @param  {[type]} color [description]
	 * @return {[type]}       [description]
	 */
	var createElementLine = function(vec3s, color) {
		var elementLine = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "elementLine");
		elementLine.BeginUpdate();
		elementLine.SetPointArray(vec3s);
		elementLine.AltitudeType = 0;
		elementLine.LineStyle.LineColor = color;
		elementLine.LineStyle.LineWidth = 1
		elementLine.EndUpdate();
		earth.AttachObject(elementLine);
		elementLines.push(elementLine);
		return elementLine;
	}

	//绘制通视的两条线（红线、绿线）
	var lineSight2Line = function(res) {
		res.ClearRes();
		resArr.push(res);
		var green = parseInt("0XFF00FF00");
		var red = parseInt("0XFFFF0000");
		var points = res.LineSightRes; // 结果三个点，如果后两个点坐标一致就是完全通视，不一致，则中间那个点是遮挡点，根据这个原则构建若干条不同颜色的element_line，我省略了，示例默认只建了一个

		var greenV3s = points.ToVector3s(); //取前两个点的的vector3s
		greenV3s.Remove(2);
		var redV3s = points.ToVector3s(); //取后两个点的的vector3s
		redV3s.Remove(0)
		var greenLine = createElementLine(greenV3s, green); //画可视的绿色线
		var redLine = createElementLine(redV3s, red); //画不可视的红色线

		var lastGeoPoint = points.GetPointAt(2);
		var groundAlt = earth.Measure.MeasureAltitude(lastGeoPoint.Longitude, lastGeoPoint.Latitude)
		var groundLineV3s = earth.Factory.CreateVector3s();
		groundLineV3s.Add(lastGeoPoint.Longitude, lastGeoPoint.Latitude, lastGeoPoint.Altitude);
		groundLineV3s.Add(lastGeoPoint.Longitude, lastGeoPoint.Latitude, groundAlt);
		var endLine = createElementLine(groundLineV3s, parseInt("0xFFFFEB89")); //画目标点的垂直于地面的线

		ares[greenLine.Guid] = points;
		ares[redLine.Guid] = points;
		ares[endLine.Guid] = points;
	}

	/**
	 * 通视分析
	 * @param startHeight 视线起点高度
	 * @param endHeight 视线终点高度
	 */
	var lineOfSight = function(startHeight, endHeight, btn) {
		var sightLine = 0; //通视分析数量
		clear();
		earth.Event.OnAnalysisFinished = function(res) {
			if(earth.htmlBallon.Guid) {
				lineSight2Line(res);
			} else {
				res.ClearRes();
				resArr = [];
			}
		};
		earth.Event.OnCreateGeometry = function(p, cType) {
			if(p.Count == 0) {
				earth.ShapeCreator.Clear();
				earth.Event.OnCreateGeometry = function() {};
				for(var i = 0; i < btn.length; i++) {
					btn[i].removeAttr("disabled");
				}
				return;
			} else {
				sightLine++;
				var geo = p.GetPointAt(0);
				var geo1 = p.GetPointAt(1);
				var vec = geo.ToVector3();
				earth.ShapeCreator.CreateLineWithFirstPoint(vec);
				earth.Analysis.LineSight(3, parseFloat(startHeight), parseFloat(endHeight), p, 3); //最后参数：1代表只进行服务端分析，2代表只进行本地分析，3代表二者都参与
				if(sightLine == 1) {
					CreatePointIcon(geo, "起始点");
					var groundLineV3s = earth.Factory.CreateVector3s();
					groundLineV3s.Add(geo.Longitude, geo.Latitude, geo.Altitude + Number(startHeight));
					groundLineV3s.Add(geo.Longitude, geo.Latitude, geo.Altitude);
					createElementLine(groundLineV3s, parseInt("0xFFFFEB89"));
				}
				CreatePointIcon(geo1, "目标点" + sightLine);
			}
		}
		earth.ShapeCreator.CreateLine();
	}

	/**
	 * 创建起始点或目标点
	 * @param {[type]} p    [坐标点]
	 * @param {[type]} name [名称]
	 */
	function CreatePointIcon(p, name) {
		var pointObj = earth.Factory.CreateElementIcon(earth.Factory.CreateGuid(), name);
		pointObj.Create(p.Longitude, p.Latitude, p.Altitude, "", "", name);
		pointObj.Visibility = true;
		pointObj.Selectable = false;
		earth.AttachObject(pointObj);
		pointIcons.push(pointObj);
		return pointObj;
	}

	/**
	 * 选取回调
	 * @param  {[type]} res [选取事件回调参数-不需要]
	 * @return {[type]}     [description]
	 */
	var on_select_changed = function(res) {
		if(earth.SelectSet.GetCount() > 0) {
			earth.Event.OnCreateGeometry = on_height_limit;
			var thisVector3s = ares[earth.SelectSet.GetObject(0).Guid];
			if(!thisVector3s) {
				return;
			}
			earth.ShapeCreator.HeightLimit(thisVector3s);
			sel_line = earth.SelectSet.GetObject(0);
			earth.SelectSet.Clear();
		}
	}

	/**
	 * 选取完之后回调
	 * @param  {[type]} p    [description]
	 * @param  {[type]} type [description]
	 * @return {[type]}      [description]
	 */
	var on_height_limit = function(p, type) {
		earth.ShapeCreator.Clear();
		sel_line.Visibility = true;
		earth.ToolManager.SphericalObjectEditTool.Select();
	}

	/**
	 * 显示高度点击事件
	 */
	var showHeightLine = function() {
		earth.ToolManager.SphericalObjectEditTool.Select();
		earth.Event.OnSelectChanged = on_select_changed;
	};
	/*--------------通视分析end-------------*/

	/**
	 * 沿路通视
	 * @param startHeight 视线起点高度
	 * @param endHeight 视线终点高度
	 * @param step 分析步长
	 */
	var mRoadLineSight = function(startHeight, endHeight, step, btn) {
		clear();
		earth.ShapeCreator.CreatePoint();
		var points = earth.Factory.CreateGeoPoints();
		earth.Event.OnCreateGeometry = function(m, mType) {
			points.add(m.Longitude, m.Latitude, m.Altitude);
			CreatePointIcon(m, "起始点");
			var groundLineV3s = earth.Factory.CreateVector3s();
			groundLineV3s.Add(m.Longitude, m.Latitude, m.Altitude + Number(startHeight));
			groundLineV3s.Add(m.Longitude, m.Latitude, m.Altitude);
			createElementLine(groundLineV3s, parseInt("0xFFFFEB89"));
			if(typeof m.Count == 'undefined') {
				earth.ShapeCreator.CreatePolyline(1, 0xccff0000);
				earth.Event.OnCreateGeometry = function(p, cType) {
					if(p == undefined || p.Count < 2) {
						alert("请沿路至少绘制两个目标点");
						for(var i = 0; i < btn.length; i++) {
							btn[i].removeAttr("disabled");
						}
						clear();
						return;
					}
					var space = step;
					var geoPoints = earth.Factory.CreateGeoPoints();
					var geoCalculator = earth.GeometryAlgorithm;
					for(var i = 0; i < p.Count; i++) {
						var geoPoint = earth.Factory.CreateGeoPoint();
						geoPoint.Longitude = p.Items(i).x;
						geoPoint.Latitude = p.Items(i).y;
						geoPoint.Altitude = p.Items(i).z;
						geoPoints.AddPoint(geoPoint);
					}
					var length = geoCalculator.CalculatePolylineLength(geoPoints);
					if(space > length) {
						var slength = parseInt(length) / 3 - 1;
						space = parseInt(slength);
						if(p.Count >= 2) {
							alert("采样间距过大，目前折线总长为" + parseInt(length) + ",自动采用了" + parseInt(slength) + "采样率");
						}
					}
					earth.Event.OnAnalysisFinished = function(result) {
						earth.Event.OnAnalysisFinished = function(res) {
							if(earth.htmlBallon.Guid) {
								lineSight2Line(res);
								for(var i = 0; i < btn.length; i++) {
									btn[i].removeAttr("disabled");
								}
							} else {
								res.ClearRes();
								lightSightRes = [];
								resArr = [];
							}
						};
						var resXml = result.BriefDescription;
						if(resXml) {
							var xmlDoc = loadXMLStr(resXml);
							var root = xmlDoc.documentElement;
							if(xmlDoc == null || xmlDoc == undefined) {
								alert('分析错误，请重试');
								return;
							}
							if(root == null || root == undefined) {
								alert('分析错误，请重试');
								return;
							}
							var pointCount = parseInt(root.selectSingleNode("point_number").text);
							var pointStr = root.selectSingleNode("point_array").text;
							var pointArr = pointStr.split(",");
							for(var i = 0; i < pointCount; i++) {
								var index = i * 4;
								var indexOne = index;
								var indexTwo = index + 1;
								var indexThree = index + 2;
								points.add(pointArr[indexOne], pointArr[indexTwo], pointArr[indexThree]);
								var geo = {
									Longitude: pointArr[indexOne],
									Latitude: pointArr[indexTwo],
									Altitude: pointArr[indexThree]
								}
								var geoIndex = i + 1;
								CreatePointIcon(geo, "目标点" + geoIndex);
								earth.Analysis.LineSight(3, parseFloat(startHeight), parseFloat(endHeight), points, 3); //最后参数：1代表只进行服务端分析，2代表只进行本地分析，3代表二者都参与
								points.RemoveAt(1);
							}
						}
					};
					earth.Analysis.Profile(1, space, geoPoints); //此接口暂时只能返回贴地的坐标点
				}
			}
		}
	};

	/**
	 * 创建视锥体
	 * @param  {[type]} pval          [坐标点位置]
	 * @param  {[type]} angle         [角度]
	 * @param  {[type]} height        [视椎体高度]
	 * @param  {[type]} shadowColor   [阴影颜色]
	 * @param  {[type]} noShadowColor [非阴影颜色]
	 * @return {[type]}               [description]
	 */
	function createViewshed(pval, angle, height, shadowColor, noShadowColor) {
		viewShedObj = earth.Factory.CreateViewShed(earth.Factory.CreateGUID(), "");
		offset = earth.Factory.CreateVector3();
		offset.X = 0;
		offset.Y = 1.5;
		offset.Z = 0.5;
		viewShedObj.BeginUpdate();
		viewShedObj.PosOffset = offset;
		height = parseFloat(height);
		viewShedObj.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude + height);
		viewShedObj.SphericalTransform.Heading = pval.Heading;
		viewShedObj.SphericalTransform.Tilt = pval.Tilt;
		viewShedObj.FovH = Number(angle);
		viewShedObj.FovV = Number(angle);
		viewShedObj.Radius = Number(pval.Radius);
		viewShedObj.ShadowColor = parseInt(shadowColor);
		viewShedObj.NoShadowColor = parseInt(noShadowColor);
		viewShedObj.EnableAssistantCone = true;
		viewShedObj.EndUpdate();
		earth.AttachObject(viewShedObj);
	}

	/**
	 * 视域分析
	 * @param  {[type]} angle         [视域角度]
	 * @param  {[type]} height        [视椎体高度]
	 * @param  {[type]} btn           [禁用的按钮对象数组]
	 * @param  {[type]} shadowColor   [阴影颜色]
	 * @param  {[type]} noShadowColor [非阴影颜色]
	 * @return {[type]}               [description]
	 */
	var viewShed = function(angle, height, btn, shadowColor, noShadowColor) {
		clear();
		earth.Event.OnAnalysisFinished = function(res) {
			if(earth.htmlBallon.Guid) {
				_result = res;
				resArr.push(res);
				for(var i = 0; i < btn.length; i++) {
					btn[i].removeAttr("disabled");
				}
			} else {
				clear();
				res.ClearRes();
				_result = null;
				resArr = [];
			}
		};
		earth.Event.OnCreateGeometry = function(p, cType) {
			earth.ShapeCreator.Clear();
			createViewshed(p, angle, height, shadowColor, noShadowColor);
		};
		earth.ShapeCreator.CreateSector(angle);
	};

	/**
	 * 定点观察
	 * @param  {[type]} height [目标点高度]
	 * @param  {[type]} btn    [禁用的按钮对象数组]
	 * @return {[type]}        [description]
	 */
	var fixedObserver = function(height, btn) {
		clear();
		earth.Event.OnCreateGeometry = function(pose) {
			earth.ShapeCreator.Clear();
			earth.Event.OnFixedPointObserveFinished = function() {
				clear();
				for(var i = 0; i < btn.length; i++) {
					btn[i].removeAttr("disabled");
				}
			};
			earth.GlobeObserver.FixedPointObserve(pose.Longitude, pose.Latitude, pose.Altitude, pose.heading, pose.tilt, pose.roll);
			earth.Event.OnCreateGeometry = function() {};
		};
		earth.ShapeCreator.createPose(height);
	};

	/**
	 * 天际线分析 沿街立面
	 * @param  {[type]}   type     [类型]
	 * @param  {[type]}   height   [高度]
	 * @param  {[type]}   dis      [可视距离]
	 * @param  {[type]}   deep     [深度]
	 * @param  {Function} callback [回调方法]
	 * @return {[type]}            [description]
	 */
	var skyline = function(type, height, dis, deep, callback) {
		clear();
		earth.Event.OnCreateGeometry = function(line) {
			if(!line || line.Count < 2) {
				if(line.Count == 1) {
					alert("划线至少需要2个点！");
					clear();
				}
				if(callback && typeof callback == "function") {
					callback();
				}
				return;
			}
			earth.Event.OnFixedPointObserveFinished = function() {
				//右键操作后触发这里.
				clear();
				if(callback && typeof callback == "function") {
					callback();
				}
				earth.Event.OnFixedPointObserveFinished = function() {};
			}
			earth.lineparam = line;
			earth.ShapeCreator.Clear();
			earth.GlobeObserver.FixedPointObserveEx3(line, height, dis, deep, type, true);

			earth.Event.OnCreateGeometry = function() {};
		};
		earth.ShapeCreator.CreatePolyline(2, 16711680);
	};

	/**
	 * 阴影分析
	 * @param tz 时区
	 * @param d 日期
	 * @param t 时间
	 * @param circle 坐标点范围
	 */
	var shinning = function(tz, d, t, circle) {
		clear();
		var currDateArr = d.split("-");
		var currTimeArr = t.split(":");
		// 根据日期和时间、地点计算太阳高度角和方位角
		if(circle) {
			var vector2 = earth.GeometryAlgorithm.CalculateSunElevationAndAzimuthAngle(tz,
				currDateArr[0], currDateArr[1], currDateArr[2],
				currTimeArr[0], currTimeArr[1], 00,
				circle.Longitude, circle.Latitude);
			var elevationAngle = vector2.X;
			var azimuthAngle = vector2.Y;
			if(elevationAngle && azimuthAngle) {
				earth.Analysis.Shinning(elevationAngle, azimuthAngle, circle, 3);
			}
		}
	};

	/**
	 * 获取高程
	 * @param  {Function} callback [回调方法]
	 * @return {[type]}            [description]
	 */
	var getAltitude = function(callback) {
		earth.Event.OnCreateGeometry = function(pval) {
			if(pval === null) {
				return;
			}
			var a = earth.Measure.MeasureTerrainAltitude(pval.Longitude, pval.latitude);
			callback(a.toFixed(2));
			earth.Event.OnCreateGeometry = function() {};
			earth.ShapeCreator.Clear();
		};
		earth.ShapeCreator.CreatePoint();
	};

	/*
	 * 分析功能，气泡弹窗
	 * @param anaLysisChk 弹出气泡的菜单ID
	 */
	var showMoveHtml = function(anaLysisChk) {
		if(Tools.getItemStyle(anaLysisChk)) {
			Tools.singleStyleCancel(anaLysisChk);
			if(htmlBalloonMove != null) {
				htmlBalloonMove.DestroyObject();
				htmlBalloonMove = null;
			}
			return;
		}
		clearMenuStyle();
		Tools.singleSelectedStyle(anaLysisChk);
		lastId = anaLysisChk;

		var earth = top.LayerManagement.earth;
		earth.Event.OnHtmlNavigateCompleted = function() {};
		var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
		var url = "";
		var param = null;
		var width = 280,
			height = 220;
		//注意：ShowNavigate只能用绝对路径
		if(anaLysisChk === "mLineSight") { //通视分析
			url = loaclUrl + "/html/analysis/linesight.html";
			width = 272;
			height = 183;
		} else if(anaLysisChk === "mRoadLineSight") { //沿路通视
			url = loaclUrl + "/html/analysis/roadLineSight.html";
			width = 272;
			height = 227;
		} else if(anaLysisChk === "mViewshed") { //视域分析
			url = loaclUrl + "/html/analysis/viewshed.html";
			width = 272;
			height = 267;
		} else if(anaLysisChk === "mShinning") { //阴影分析
			url = loaclUrl + "/html/analysis/sunshine.html";
			width = 272;
			height = 266;
		} else if(anaLysisChk === "mInsolation") { //日照分析
			url = loaclUrl + "/html/analysis/insolation.html";
			width = 272;
			height = 438;
		} else if(anaLysisChk === "mSkyline") { //天际线分析-沿街立面s
			url = loaclUrl + "/html/analysis/skyline.html";
			width = 346;
			height = 308;
		} else if(anaLysisChk === "mValley") { //淹没分析
			url = loaclUrl + "/html/analysis/submerge.html";
			width = 340;
			height = 411;
		} else if(anaLysisChk === "mExcavationAndFill") { //挖填分析
			url = loaclUrl + "/html/analysis/excavationAndFill.html";
		} else if(anaLysisChk === "currentBuilding") { //现状建筑
			url = loaclUrl + "/html/analysis/currentBuilding.html";
			width = 300;
		} else if(anaLysisChk === "mFixedObserver") { //视野分析
			url = loaclUrl + "/html/analysis/pointview.html";
			width = 269;
			height = 143;
		} else if(anaLysisChk === "importAlbuginea") { //impBuilding2
			url = loaclUrl + "/html/project/importAlbuginea.html";
			width = 323;
			height = 311;
		} else if(anaLysisChk === "importModel") {
			url = loaclUrl + "/html/project/importModel.html";
			width = 323;
			height = 227;
		} else if(anaLysisChk === "quotalook") { //指标查看
			var node = top.selNode;
			width = 1120, height = 670;
			if(node) {
				if(node.type == "PLAN") { //方案指标
					param = {
						earth: earth,
						nodeId: node.id
					};
					url = loaclUrl + "/html/project/quotalook.html";
				} else if(node.type == "PARCEL") { //规划用地
					param = {
						earth: earth,
						nodeId: node.projectId,
						type: "PARCEL"
					};
					url = loaclUrl + "/html/project/quotasubject.html";
				} else if(node.type == "ROADLINE") { //道路红线
					param = {
						earth: earth,
						nodeId: node.projectId,
						type: "ROADLINE"
					};
					url = loaclUrl + "/html/project/quotasubject.html";
				}
			}
		} else if(anaLysisChk === "buildingIndex") { //用地指标
			var node = top.selNode;
			width = 500, height = 271;
			if(node) {
				if(node.type == "PLAN") {
					param = {
						earth: earth,
						nodeId: node.projectId,
						type: "PLAN",
						planId: node.id
					};
					url = loaclUrl + "/html/analysis/buildingIndex.html";
				}
			}
		} else if(anaLysisChk === "clipScene") { //场景裁切
			url = loaclUrl + "/html/view/clipscene.html";
			width = 300;
			height = 165;
		}

		if(url === "") {
			return;
		}
		if(top.picturesBalloons != null) {
			top.picturesBalloons.DestroyObject();
			top.picturesBalloonsHidden = false;
			top.picturesBalloons = null;
		}
		if(top.transparencyBalloons != null) {
			if(top.transparencyBalloons.Name != "transparency") {
				top.transparencyBalloons.DestroyObject();
				top.transparencyBalloonsHidden = false;
				top.transparencyBalloons = null;
			}
		}
		if(htmlBalloonMove != null) {
			htmlBalloonMove.DestroyObject();
			htmlBalloonMove = null;
		}
		htmlBalloonMove = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), "");
		htmlBalloonMove.SetScreenLocation(width / 2 + top.dialogLeft, 0);
		htmlBalloonMove.SetRectSize(width, height);
		htmlBalloonMove.SetIsAddBackgroundImage(false);
		htmlBalloonMove.ShowNavigate(url);
		earth.Event.OnDocumentReadyCompleted = function(guid) {
			earth.htmlBallon = htmlBalloonMove;
			earth.analysisObj = top.STAMP.Analysis(earth);
			earth.param = param;
			earth.userdataTemp = top.userdataTemp;
			earth.projManager = top.projManager;
			earth.projNodeId = top.projNodeId;
			earth.editLayers = top.editLayers;
			earth.currentPlanLayerId = top.currentPlanLayerId;
			earth.projectLayerMap = top.projectLayerMap;
			earth.projectLayerIdList = top.projectLayerIdList;
			earth.SYSTEMPARAMS = top.SYSTEMPARAMS;
			earth.generateEditDll = top.getGenerateEditIndex();
			earth.projectNode = top.getOperatorObject().getCurrentProject(); //当前审批中的项目
			earth.currentPlanName = top.currentPlanName; //当前编辑中的方案
			if(htmlBalloonMove === null) {
				return;
			}
			if(htmlBalloonMove.Guid == guid) {
				htmlBalloonMove.InvokeScript("getEarth", earth);
			}
		};
		earth.Event.OnHtmlBalloonFinished = function(id) {
			if(htmlBalloonMove != null && id === htmlBalloonMove.Guid) {
				htmlBalloonMove.DestroyObject();
				htmlBalloonMove = null;
				clearMenuStyle();
				earth.Event.OnHtmlBalloonFinished = function() {};
			}
		};
	};

	/**
	 * 清除指定的气泡对象
	 * @param  {[object]} htmlBall [气泡对象]
	 * @return {[type]}          [description]
	 */
	var clearHtmlBallon = function(htmlBall) {
		if(htmlBall != null) {
			htmlBall.DestroyObject();
			htmlBall = null;
		}
	};

	/**
	 * 检查两个坐标点(Vector3对象)是否相等
	 * @param  {[Vector3]} vector1 [点1]
	 * @param  {[Vector3]} vector2 [点2]
	 * @return {[bool]}         [true：相等；false：不相等]
	 */
	var checkVectorEqual = function(vector1, vector2) {
		if(vector1.X != vector2.X || vector1.Y != vector2.Y || vector1.Z != vector2.Z) {
			return false;
		} else {
			return true;
		}
	}

	/*
	 *楼间距
	 */
	var mFloorToFloor = function() {
		clear();
		var modelArr = [];
		var isPolygon = true;
		var lineObj;
		var userdataObj = {};
		earth.ToolManager.SphericalObjectEditTool.Select();
		earth.Event.OnSelectChanged = function(x) {
			var selectSet = earth.SelectSet;
			if(selectSet.GetCount() == 0) {
				return;
			}
			for(var i = 0; i < selectSet.GetCount(); i++) {
				var element = selectSet.GetObject(i);
				if((element.Rtti === 223 && element.Type == 1) || element.Rtti === 280 || element.Rtti === 207) { //280/220    EditModel= 229,
					modelArr.push(element);
					element.ShowHighLight();
				} else {
					isPolygon = false;
				}
			}

			if(!isPolygon) {
				alert("请确认选择的是建筑模型对象，且选择的对象不能超过2个！");
				earth.ToolManager.SphericalObjectEditTool.Browse();
				isPolygon = true;
			} else if(modelArr.length > 2) {
				alert("选择的建筑模型不能超过2个！");
				earth.ToolManager.SphericalObjectEditTool.Browse();
				isPolygon = true;
			}

			if(modelArr.length == 2) {
				var buildingpolygonArr = [];
				var buildingHeightArr = [];
				for(var m = 0; m < modelArr.length; m++) {
					var buildingArea = buildBottomArea(modelArr[m]); //查询建筑基底信息
					if(buildingArea == null) { //为空说明不属于方案模型，支持方案外的建筑
						var buildingpolygon = earth.GeometryAlgorithm.CalculateModelContour(modelArr[m].Guid);
						if(!buildingpolygon) {
							alert("选择模型不正确！");
							return;
						}
						var vector2s = buildingpolygon.Items(0);
						var vector3s = earth.Factory.CreateVector3s();
						for(var n = 0; n < vector2s.Count; n++) {
							var vector2 = vector2s.GetPointAt(n);
							var v3 = earth.Factory.CreateVector3();
							v3.X = vector2.Longitude;
							v3.Y = vector2.Latitude;
							v3.Z = vector2.Altitude;
							if(n == (vector2s.Count - 1)) {
								var firstPoint = vector3s.Items(0)
								if(checkVectorEqual(firstPoint, v3)) {
									break;
								}
							}
							vector3s.AddVector(v3);
						}
						buildingpolygonArr.push(vector3s);
					} else {
						var vector3s = buildingArea.obj.SphericalVectors;
						var maxIndex = vector3s.Count - 1;
						var firstPoint = vector3s.Items(0);
						var lastPoint = vector3s.Items(maxIndex);
						if(checkVectorEqual(firstPoint, lastPoint)) { //解决bug1569,首尾点相同,去掉最后一个点
							vector3s.Remove(maxIndex);
						}
						buildingpolygonArr.push(vector3s);
						buildingHeightArr.push(buildingArea.height);
					}
				}

				var result = earth.GeometryAlgorithm.CalculatePolygonDistance(buildingpolygonArr[0], buildingpolygonArr[1]);
				//result.length返回-1代表相交,0代表有且仅有一个共同点
				if(result) {
					if(result.Length == 0) {
						modelArr = modelArr.splice(1, 1);
					}

					var pointVect = {};
					if(result.Count > 1) {
						pointVect.Longitude = (result.Items(0).X + result.Items(1).X) / 2;
						pointVect.Latitude = (result.Items(0).Y + result.Items(1).Y) / 2;
						pointVect.Altitude = (result.Items(0).Z + result.Items(1).Z) / 2;
					}
					var diMianHeight = earth.Measure.MeasureTerrainAltitude(pointVect.Longitude, pointVect.Latitude);
					for(var i = 0; i < buildingHeightArr.length; i++) {
						if(parseFloat(pointVect.Altitude) < parseFloat(diMianHeight) + parseFloat(buildingHeightArr[i])) {
							pointVect.Altitude = parseFloat(diMianHeight) + parseFloat(buildingHeightArr[i]);
						}
					}

					var length = result.Length;
					length = length > 0 ? parseFloat(length).toFixed(2) : 0;
					var showResult = "建筑间距：" + length + "米";
					_showMeasureResult(showResult);
					if(length != 0) { //距离不为0时需要绘制距离线
						if(result.Count > 1) {
							var v3s1 = earth.Factory.CreateVector3s();
							v3s1.Add(result.Items(0).X, result.Items(0).Y, diMianHeight);
							v3s1.Add(result.Items(0).X, result.Items(0).Y, pointVect.Altitude);
							floorLineObjArr.push(createLineObj(v3s1));

							var v3s2 = earth.Factory.CreateVector3s();
							v3s2.Add(result.Items(1).X, result.Items(1).Y, diMianHeight);
							v3s2.Add(result.Items(1).X, result.Items(1).Y, pointVect.Altitude);
							floorLineObjArr.push(createLineObj(v3s2));

							var v3s3 = earth.Factory.CreateVector3s();
							v3s3.Add(result.Items(0).X, result.Items(0).Y, pointVect.Altitude);
							v3s3.Add(result.Items(1).X, result.Items(1).Y, pointVect.Altitude);
							floorLineObjArr.push(createLineObj(v3s3, true));

							var v3s4 = earth.Factory.CreateVector3s();
							v3s4.Add(result.Items(1).X, result.Items(1).Y, pointVect.Altitude);
							v3s4.Add(result.Items(0).X, result.Items(0).Y, pointVect.Altitude);
							floorLineObjArr.push(createLineObj(v3s4, true));
						}

						var showIconResult = length + "米";
						floorLineObjArr.push(createDistanceIcon(pointVect, showIconResult));
					}

					earth.Event.OnHtmlBalloonFinished = function() {
						earth.Event.OnHtmlBalloonFinished = function() {};
						clear();
					};

					modelArr = [];
					earth.ToolManager.SphericalObjectEditTool.Browse();
				}
			}

		}
	}

	/**
	 * 创建楼间距连接线
	 * @param  {[type]} result    [楼间距结果]
	 * @param  {[bool]} arrowType [是否有箭头]
	 * @return {[type]}           [连接线对象]
	 */
	function createLineObj(result, arrowType) {
		var lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
		lineObj.BeginUpdate();
		lineObj.SetPointArray(result);
		lineObj.Visibility = true;
		var Linestyle = lineObj.LineStyle;
		Linestyle.LineWidth = 2;
		Linestyle.LineColor = parseInt(0xccffff00);
		lineObj.AltitudeType = 0;
		if(arrowType) {
			lineObj.ArrowType = 2;
		}
		lineObj.EndUpdate();
		earth.AttachObject(lineObj);
		return lineObj;
	}

	/**
	 * 获取建筑的建筑基底矢量面对象
	 * model 是建筑模型
	 * 返回对应建筑的建筑基底
	 **/
	function buildBottomArea(model) {
		var modelLayer = top.editLayers[model.GetParentNode().Guid]; //模型图层
		if(!modelLayer) {
			return null;
		}
		var polygonLayerName = modelLayer.name.replace("buildingsmodel", "buildingspolygon");
		var buildData = projManager.getBuildingDataById(model.Guid);
		var planID = "";
		var buildingHeight = 0;
		if(buildData && buildData.length > 0) {
			planID = buildData[0]["CPBUILDING.PLANID"];
			buildingHeight = buildData[0]["CPBUILDING.JZGD"];
		} else {
			var simpleBuild = projManager.getSimpleBuildingDataById(model.Guid);
			if(simpleBuild && simpleBuild.length > 0) {
				planID = simpleBuild[0]["CPSIMPLEBUILD.PLANID"];
				if(model.Rtti == 280) {
					buildingHeight = parseFloat(simpleBuild[0]["CPSIMPLEBUILD.FLOOR"]) * parseFloat(simpleBuild[0]["CPSIMPLEBUILD.FLOORHIGHT"]) + parseFloat(model.GetRoofHeight());
				} else {
					buildingHeight = parseFloat(simpleBuild[0]["CPSIMPLEBUILD.FLOOR"]) * parseFloat(simpleBuild[0]["CPSIMPLEBUILD.FLOORHIGHT"]);
				}
			}
			return {
				obj: model,
				height: buildingHeight
			};
		}
		if(planID == undefined || planID == "") {
			return null;
		}
		var planLayers = projManager.getLayerIdsByPlanId(planID);
		for(var j = 0; j < planLayers.length; j++) {
			var getEditLayers = top.editLayers;
			var editLayer = getEditLayers[planLayers[j]];
			if(editLayer && editLayer.DataLayerType == 5 && editLayer.Name == polygonLayerName) {
				for(var k = 0; k < editLayer.GetObjCount(); k++) {
					var obj = editLayer.GetObjAt(k);
					if(obj.name.toLowerCase() == model.name.toLowerCase()) {
						return {
							obj: obj,
							height: buildingHeight
						};
					}
				}
			}
		}
		return null;
	}

	/*
	 *创建建筑距离标注
	 *@param pVal 标注中心坐标点
	 *@param pText 标注文字
	 *@return 无
	 */
	var createDistanceIcon = function(pVal, pText) {
		var guid = earth.Factory.CreateGuid();
		var iconObj = earth.Factory.CreateElementIcon(guid, "distance");
		iconObj.Create(pVal.Longitude, pVal.Latitude, pVal.Altitude, "", "", pText);
		iconObj.textColor = parseInt("0xccffff00");
		iconObj.Visibility = true;
		earth.AttachObject(iconObj);
		return iconObj;
	}

	/**
	 * 最长日照时间测量
	 * @param btnObj:开始分析按钮;
	 * @param lightObj:日照时间框;
	 * @param month:月;
	 * @param day:日
	 * @param begin:开始时间;
	 * @param end:结束时间;
	 * @param acc:true累计有效日照,false连续有效日照
	 * @param resultCount:0所有时间段,2两个时间段,3三个时间段;
	 * @param stepObj:步长输入框
	 */
	var insolation = function(btnObj, lightObj, month, day, begin, end, acc, resultCount, singlePoint, stepObj) {
		var step = stepObj.val();
		earth.Event.OnMeasureFinish = function(result, type) {
			result = Number(result);
			if(result || result == 0) {
				var totalMins = result * 60;
				totalMins = Math.ceil(totalMins);
			}
			lightObj.val(totalMins);
			btnObj.attr("disabled", false);
			stepObj.attr("disabled", false);
			earth.Event.OnMeasureFinish = function() {};
		};
		earth.Measure.Insolation(month, day, begin, end, acc, resultCount, singlePoint, step);
	}

	/**
	 * 阴影分析
	 * @param  {[type]} btn1   [打开的按钮]
	 * @param  {[type]} btn2   [禁用的按钮]
	 * @param  {[type]} dqdate [日期时间]
	 * @return {[type]}        [description]
	 */
	var shadow = function(btn1, btn2, dqdate) {
		clear();
		earth.Event.OnCreateGeometry = function(pval, type) {
			earth.Event.OnCreateGeometry = function() {};
			extent = pval;
			if(extent) {
				earth.Event.OnAnalysisFinished = function(res) {
					earth.Event.OnAnalysisFinished = function() {};
					if(earth.htmlBallon.Guid) {
						_result = res;
						for(var i = 0; i < btn1.length; i++) {
							btn1[i].removeAttr("disabled");
						}
						btn2.attr("disabled", "disabled");
					} else {
						clear();
						res.ClearRes();
						_result = null;
					}
				};
				var longitude = earth.GlobeObserver.TargetPose.Longitude;
				var latitude = earth.GlobeObserver.TargetPose.latitude;
				var nowTime = btn1[2].val().split(":");
				var currDateArr = dqdate.val().split("-");
				var shineTime = earth.GeometryAlgorithm.CalculateSunriseAndSunset(currDateArr[0], currDateArr[1], currDateArr[2], longitude, latitude);
				var st = Number(nowTime[0]) + Number(nowTime[1]) / 60;
				if(st >= Number(shineTime.X) && st <= Number(shineTime.Y)) {
					analysis.shinning(8, dqdate.val(), btn1[2].val(), extent, false);
				} else {
					for(var i = 0; i < btn1.length; i++) {
						btn1[i].removeAttr("disabled");
					}
					btn2.attr("disabled", "disabled");
					alert("当前时间不在有效分析范围内！");
					clear();
					return;
				}
			}
		}
		earth.ShapeCreator.CreateCircle();
	};

	/**
	 * 场景裁切
	 * @param  {[type]} vertical [是否水平]
	 * @param  {[type]} types    [类型：标识要分析的对象集合]
	 * @return {[type]}          [description]
	 */
	var clipScene = function(vertical, types) {
		clear();
		earth.Event.OnMeasureFinish = function(result, type) {
			clear();
		}
		setTimeout(function() { //延迟否则与OnHtmlBalloonFinished冲突
			earth.Measure.ClipScene(vertical, types);
		}, 100);
	}

	/**
	 * 阴影动态模拟结束事件
	 * @param  {[type]} btn1           [打开的按钮]
	 * @param  {[type]} btn2           [禁用的按钮]
	 * @param  {[type]} dqdate         [日期时间]
	 * @param  {[type]} startShingTime [开始时间]
	 * @param  {[type]} endShingTime   [结束时间]
	 * @return {[type]}                [description]
	 */
	var simulation = function(btn1, btn2, dqdate, startShingTime, endShingTime) {
		earth.Event.OnAnalysisFinished = function(res) {
			if(earth.htmlBallon.Guid) {
				if(_result) {
					_result.ClearRes();
				}
				resArr.push(res);
				var dates = dqdate.val().split("-");
				var times = btn1[2].val().split(":");
				var curDate = new Date(dates[0], dates[1] - 1, dates[2], times[0], times[1], 00);
				curDate.setTime(curDate.getTime() + btn1[3].val() * 60 * 1000);
				setDateTime(curDate, btn1, dqdate);

				var timeN = btn1[2].val().split(":");
				var st = Number(timeN[0]) + Number(timeN[1]) / 60;
				var startTime = startShingTime.split(":");
				var endTime = endShingTime.split(":");
				var stStart = Number(startTime[0]) + Number(startTime[1]) / 60;
				var stEnd = Number(endTime[0]) + Number(endTime[1]) / 60;

				if(extent != null && st < stEnd && st > stStart) {
					if(resArr.length > 1) {
						resArr[resArr.length - 2].ClearRes();
						if(btn1[0].text() == "动态模拟") {
							resArr[resArr.length - 1].ClearRes();
							setDateTime(new Date(), btn1, dqdate);
							return;
						}
					}
					btn1[5].attr("disabled", "disabled");
					btn1[6].attr("disabled", "disabled");
					shinning(8, dqdate.val(), btn1[2].val(), extent);
				} else {
					btn1[0].text("动态模拟");
					btn1[0].attr("disabled", "disabled");
					btn1[5].removeAttr("disabled");
					btn1[6].removeAttr("disabled");
					setDateTime(new Date(), btn1, dqdate);
					clear();
					for(var i = 0; i < resArr.length; i++) {
						resArr[i].ClearRes();
					}
					resArr = [];
				}
			} else {
				clear();
				res.ClearRes();
				for(var i = 0; i < resArr.length; i++) {
					resArr[i].ClearRes();
				}
				resArr = [];
			}
		};
		shinning(8, dqdate.val(), btn1[2].val(), extent);
	}

	/**
	 * 设置日期时间
	 * @param {[type]} now    [日期时间]
	 * @param {[type]} btn1   [时分：输入框]
	 * @param {[type]} dqdate [年月日时间控件]
	 */
	var setDateTime = function(now, btn1, dqdate) {
		var year = now.getFullYear();
		var month = now.getMonth() + 1;
		if(month < 10) {
			month = "0" + month
		}
		var day = now.getDate();
		if(day < 10) {
			day = "0" + day
		}
		var hour = now.getHours();
		if(hour < 10) {
			hour = "0" + hour
		}
		var minute = now.getMinutes();
		if(minute < 10) {
			minute = "0" + minute
		}
		var second = now.getSeconds();
		if(second < 10) {
			second = "0" + second
		}
		dqdate.val(year + "-" + month + "-" + day);
		btn1[2].val(hour + ":" + minute);
	};

	/**
	 * 平整开挖
	 * @param  {[type]} vects           [开挖矢量面]
	 * @param  {[type]} currentPrjDepth [开挖深度]
	 * @return {[type]}                 [description]
	 */
	function beginDigLayer(vects, currentPrjDepth) {
		if(!vects) {
			return;
		}

		if(top.g_currTempLayer != null) {
			earth.DetachObject(top.g_currTempLayer);
			top.g_currTempLayer = null;
		}
		clear();
		if(currentPrjDepth != 0) {
			if(!$.isArray(vects)) {
				vects = [vects];
			}
			if(!vects || vects.length == 0) {
				return;
			}
			for(var i = 0; i < vects.length; i++) {
				initFillAlt(vects[i], Number(currentPrjDepth));
			}

			var guid = earth.Factory.CreateGuid();
			//这里最后必须要添加两个反斜杠 否则不出现效果 因为底层调用CreateDEMLayer方法追加字符并没有判断
			var tempDemPath = earth.RootPath + "temp\\terr1\\terrain\\";
			var rect = earth.TerrainManager.GetTempLayerRect();
			var levelMin = earth.TerrainManager.GetTempLayerMinLevel();
			var levelMax = earth.TerrainManager.GetTempLayerMaxLevel();
			top.g_currTempLayer = earth.Factory.CreateDEMLayer(guid,
				"TempTerrainLayer",
				tempDemPath,
				rect,
				levelMin,
				levelMax, 1000);
			top.g_currTempLayer.Visibility = true;
			earth.AttachObject(top.g_currTempLayer);
		}
	};

	/**
	 * 开挖
	 * @param  {[type]} m_souVet3s      [开挖矢量面]
	 * @param  {[type]} currentPrjDepth [开挖深度]
	 * @return {[type]}                 [description]
	 */
	function initFillAlt(m_souVet3s, currentPrjDepth) {
		var cHeight = null;
		try {
			var newPolygon = earth.Factory.CreatePolygon();
			newPolygon.AddRing(m_souVet3s);
			var centerPoint = newPolygon.GetCenterPoint();
			if(centerPoint) {
				cHeight = earth.Measure.MeasureTerrainAltitude(centerPoint.X, centerPoint.Y);
			}
		} catch(e) {
			cHeight = null;
		}
		var vetBottom = earth.Factory.CreateVector3s();
		for(var ni = 0; ni < m_souVet3s.Count; ni++) {
			var x = m_souVet3s.Items(ni).X;
			var y = m_souVet3s.Items(ni).Y;
			var z = m_souVet3s.Items(ni).Z;
			var zB = z - currentPrjDepth;
			if(cHeight != null) {
				zB = cHeight - currentPrjDepth;
			}
			vetBottom.Add(x, y, zB);
		}
		earth.TerrainManager.SetMinClipLevel(10);
		earth.TerrainManager.SetTargetFolder(earth.RootPath + "temp\\terr1");
		earth.TerrainManager.ClipTerrainByPolygon(vetBottom, true);
		var alt = m_souVet3s.Items(0).Z - currentPrjDepth;
		if(cHeight != null) {
			alt = cHeight - currentPrjDepth;
		}
		earth.Event.OnAnalysisFinished = function(result, alt) {
			earth.Event.OnAnalysisFinished = function() {};
			var fontColor = top.SYSTEMPARAMS.balloonAlpha > 0 ? '#fffffe' : '#0075C8';
			var numberColor = top.SYSTEMPARAMS.balloonAlpha > 0 ? '#ffff00' : '#DC7623';
			var res = "<html><body><div style='margin: 5; padding: 2px;margin-left:20px;'>" +
				"<table style='color: " + fontColor + ";font: 14px Microsoft Yahei;'><tr><td> 开挖深度:</td><td style='color:" + numberColor + ";font-weight:bold'>" + currentPrjDepth + "</td><td>米</td></tr>" +
				"<tr><td>挖方量:</td><td style='color:" + numberColor + ";font-weight:bold'>" + result.Excavation.toFixed(2) + "</td><td>立方米</td></tr>" +
				"<tr><td>填方量:</td><td style='color:" + numberColor + ";font-weight:bold'>" + result.Fill.toFixed(2) + "</td><td>立方米</td></tr></table></div></body></html>";
			showFillBalloon(res);
		};
		earth.Analysis.SurfaceExcavationAndFill(alt, m_souVet3s);
	};

	/*
	 * 显示地形平整填挖方结果气泡
	 * @param htmlStr 气泡内html字符串
	 */
	function showFillBalloon(htmlStr) {
		var transparencyBalloons = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), "屏幕坐标窗体URL");
		transparencyBalloons.SetIsAddCloseButton(true);
		transparencyBalloons.SetIsAddMargin(true);
		transparencyBalloons.SetIsAddBackgroundImage(true);
		if(top.SYSTEMPARAMS.balloonAlpha > 0) {
			transparencyBalloons.SetRectSize(290, 140);
			transparencyBalloons.SetIsTransparence(true);
			transparencyBalloons.SetBackgroundAlpha(0xcc);
			transparencyBalloons.SetScreenLocation(290 / 2 + top.dialogLeft, 0);
		} else {
			transparencyBalloons.SetRectSize(330, 180);
			transparencyBalloons.SetIsTransparence(false);
			transparencyBalloons.SetScreenLocation(330 / 2 + top.dialogLeft, -20);
		}

		transparencyBalloons.ShowHtml(htmlStr);
		bolonArr.push(transparencyBalloons);
		earth.Event.OnHtmlBalloonFinished = function(id) {
			if(transparencyBalloons != null && id === transparencyBalloons.Guid) {
				transparencyBalloons.DestroyObject();
				transparencyBalloons = null;
			}
			earth.Event.OnHtmlBalloonFinished = function() {};
		};
	}

	/********************************淹没分析 START********************************************/
	/**
	 * 根据圆获得vecter3s对象
	 * @param  {[type]} p           [圆范围对象]
	 * @param  {[type]} waterHeight [水淹高程]
	 * @return {[type]}             [description]
	 */
	var getCircleVec3s = function(p, waterHeight) {
		var vecs = earth.GeometryAlgorithm.CreatePolygonFromCircle(p.Radius, 24);
		var vec3s = earth.Factory.CreateVector3s();
		for(var i = 0; i < vecs.Count; i++) {
			earth.GeometryAlgorithm.SetPose(p.Longitude, p.Latitude, p.Altitude, 0, 0, 0, 1, 1, 1 )
			var vec = earth.GeometryAlgorithm.TransformCartesionToSphrerical(vecs.Items(i))
			vec3s.Add(vec.X, vec.Y, waterHeight)
		}
		return vec3s;
	}
	/*
	 * 水淹分析-动态模拟
	 * @param vec3s 创建淹没水面的空间对象vector3s
	 * @param waterBottom 水底高程,如果不是动态模拟为null
	 * @param waterTop 目标水深+水底高程
	 * @param time 淹没时间
	 * @param isShowSide 是否显示侧面,水面边界延伸到地面
	 */
	var createSubmergePolygon = function(vec3s, waterBottom, waterTop, time, isShowSide, callback) {
		if(!vec3s) {
			vec3s = submergeVec3s;
		} else {
			submergeVec3s = vec3s;
		}
		if(submergePolygon) {
			earth.DetachObject(submergePolygon);
			submergePolygon = null;
		}
		var guid = earth.Factory.CreateGuid();
		submergePolygon = earth.Factory.CreatePolygonSubmerging(guid, "submerge");

		submergePolygon.SphericalVectors = vec3s;
		submergePolygon.BeginUpdate();
		if(isShowSide) {
			submergePolygon.ShowSide = isShowSide;
			submergePolygon.SideColor = parseInt("0xff00A2E8")
		}
		submergePolygon.EndUpdate();
		earth.AttachObject(submergePolygon);
		if(time) {//动态模拟
			submergePolygon.SetParam(waterBottom, waterTop, time);
		} else {//直接分析的结果
			submergePolygon.SetParam(waterBottom, waterTop, 0.01);
		}
		submergePolygon.Wave = 100;
		submergePolygon.Start();
		if(callback && typeof callback == "function") {
			callback();
		}
	}

	/**
	 * 根据折线得到缓冲面v3s
	 * @param  {[type]} lineGeoPoints [description]
	 * @param  {[type]} waterHeight   [description]
	 * @param  {[type]} buffer        [description]
	 * @return {[type]}               [description]
	 */
	var getBufferVector3s = function(lineGeoPoints, waterHeight, buffer) {
		var v3s = earth.Factory.CreateVector3s();
		var bufGeoPoints = earth.GeometryAlgorithm.CreatePolygonFromPolylineAndWidth(lineGeoPoints, buffer, buffer);
		for(var i = 0; i < bufGeoPoints.Count; i++) {
			pt = bufGeoPoints.GetPointAt(i);
			v3s.Add(pt.Longitude, pt.Latitude, waterHeight);
		}
		return v3s;
	}

	/**
	 * 根据绘制的多边形获取外扩多边形ve3
	 * @param  {[type]} polygonVec3s [多边形点集]
	 * @param  {[type]} waterHeight  [水淹高程]
	 * @param  {[type]} buffer       [缓冲半径]
	 * @return {[type]}              [description]
	 */
	var getPolygonVec3s = function(polygonVec3s, waterHeight, buffer) {
		var parallelPolygonVec3s = earth.GeometryAlgorithm.CreateParallelPolygon(polygonVec3s, buffer, 1);
		for(var i = 0; i < parallelPolygonVec3s.Count; i++) {
			parallelPolygonVec3s.Items(i).Z = waterHeight;
		}
		return parallelPolygonVec3s;
	}

	/**
	 * [getSubmergeArea 得到淹没面积填充到界面中]
	 * @param  {[type]} res     [分析得到的结果]
	 * @param  {[type]} areaObj [面积输入框控件]
	 * @return {[type]}         [description]
	 */
	function getSubmergeArea(res, areaObj) {
		var elementArea = 0;
		var elementWaterCount = res.GetGeometryWaterCount();
		for(var i = 0; i < elementWaterCount; i++) {
			var thisElementWater = res.GetGeometryWater(i);
			var thisArea = thisElementWater.Area;
			elementArea += thisArea;
		}
		elementArea = elementArea.toFixed(2);
		areaObj.val(elementArea);
	}

	/**
	 * 点源淹没
	 * @param  {[type]}   subwater1   [null]
	 * @param  {[type]}   waterHeight [水淹高程]
	 * @param  {[type]}   time        [时间]
	 * @param  {Boolean}  isShowSide  [是否显示边界]
	 * @param  {Function} callback    [回调]
	 * @param  {[type]}   areaObj     [分析结果显示控件]
	 * @return {[type]}               [description]
	 */
	var submergePoint = function(subwater1, waterHeight, time, isShowSide, callback, areaObj) {
		earth.Event.OnAnalysisFinished = function(res) {
			getSubmergeArea(res, areaObj);
			res.ClearRes();
		};
		earth.Event.OnCreateGeometry = function(p, cType) {
			if(p.Count < 2) {
				alert("请至少画两个点");
			}
			earth.ShapeCreator.Clear();
			earth.Analysis.IfWater(true);
			if(subwater1) {
				var vec3s = getCircleVec3s(p, subwater1);
			} else {
				var vec3s = getCircleVec3s(p, waterHeight);
			}
			createSubmergePolygon(vec3s, subwater1, waterHeight, time, isShowSide, callback);
			earth.Analysis.Submerge(waterHeight, p);
		};
		earth.ShapeCreator.CreateCircle();

	}
	/**
	 * 流域分析
	 * @param  {[type]}   subwater1   [null]
	 * @param  {[type]}   waterHeight [水淹高程]
	 * @param  {[type]}   time        [时间]
	 * @param  {Boolean}  isShowSide  [是否显示边界]
	 * @param  {[type]}   buffer      [缓冲半径]
	 * @param  {Function} callback    [回调]
	 * @param  {[type]}   areaObj     [分析结果显示控件]
	 * @return {[type]}               [description]
	 */
	var submergeLine = function(subwater1, waterHeight, time, isShowSide, buffer, callback, areaObj) {
		earth.Event.OnAnalysisFinished = function(res) {
			getSubmergeArea(res, areaObj);
			res.ClearRes();
		};
		earth.Event.OnCreateGeometry = function(p, cType) {
			if(p.Count < 2) {
				alert("请至少画两个点");
				return;
			}
			earth.ShapeCreator.Clear();
			earth.Analysis.IfWater(true);
			earth.Analysis.Valley(waterHeight, buffer, p);
			var lineGeoPoints = earth.Factory.CreateGeoPoints();
			for(var i = 0; i < p.Count; i++) {
				lineGeoPoints.Add(p.Items(i).X, p.Items(i).Y, p.Items(i).Z);
			}
			if(subwater1) {
				var vec3s = getBufferVector3s(lineGeoPoints, subwater1, buffer);
			} else {
				var vec3s = getBufferVector3s(lineGeoPoints, waterHeight, buffer);
			}
			createSubmergePolygon(vec3s, subwater1, waterHeight, time, isShowSide, callback)
		}
		earth.ShapeCreator.CreatePolyline(0, 0xcc111111);
	}

	/**
	 * 面域分析
	 * @param  {[type]}   subwater1   [null]
	 * @param  {[type]}   waterHeight [水淹高程]
	 * @param  {[type]}   time        [时间]
	 * @param  {Boolean}  isShowSide  [是否显示边界]
	 * @param  {[type]}   buffer      [缓冲半径]
	 * @param  {Function} callback    [回调]
	 * @param  {[type]}   areaObj     [分析结果显示控件]
	 * @return {[type]}               [description]
	 */
	var submergePolygons = function(subwater1, waterHeight, time, isShowSide, buffer, callback, areaObj) {
		earth.Event.OnAnalysisFinished = function(res) {
			getSubmergeArea(res, areaObj);
			res.ClearRes();
		};
		earth.Event.OnCreateGeometry = function(p, cType) {
			if(p.Count < 3) {
				alert("请至少画三个点");
				return;
			}
			earth.ShapeCreator.Clear();
			earth.Analysis.IfWater(true);
			earth.Analysis.Valley(waterHeight, buffer, p);

			if(subwater1) {
				var vec3s = getPolygonVec3s(p, subwater1, buffer);
			} else {
				var vec3s = getPolygonVec3s(p, waterHeight, buffer);
			}
			createSubmergePolygon(vec3s, subwater1, waterHeight, time, isShowSide, callback);
		}
		earth.ShapeCreator.CreatePolygon();
	}
	/*-----------------淹没分析end------------------*/

	//清除菜单选中状态
	var clearMenuStyle = function() {
		if(lastId) {
			top.Tools.singleStyleCancel(lastId);
			lastId = null;
		}
	}

	analysis.clearMenuStyle = clearMenuStyle;
	analysis.clear = clear; // 清除临时数据
	analysis.clearHtmlBallon = clearHtmlBallon;
	analysis.clipScene = clipScene; //剖切分析
	analysis.fixedObserver = fixedObserver; // 定点观察
	analysis.lineOfSight = lineOfSight; // 视线分析
	analysis.mRoadLineSight = mRoadLineSight; //沿路通视
	analysis.showHeightLine = showHeightLine; // 通视控高
	analysis.viewShed = viewShed; // 视域分析
	analysis.skyline = skyline; // 天际线
	analysis.shinning = shinning; // 日照
	analysis.getAltitude = getAltitude; // 获取高程
	analysis.submergePoint = submergePoint; //点源淹没
	analysis.submergeLine = submergeLine; //流域分析
	analysis.createSubmergePolygon = createSubmergePolygon; //创建淹没水面
	analysis.submergePolygons = submergePolygons; //面域分析
	analysis.shadow = shadow; //阴影分析
	analysis.simulation = simulation; //阴影动态模拟
	analysis.insolation = insolation; //日照分析
	analysis.beginDigLayer = beginDigLayer; //平整开挖
	analysis.showMoveHtml = showMoveHtml;
	analysis.mFloorToFloor = mFloorToFloor;

	return analysis;
};