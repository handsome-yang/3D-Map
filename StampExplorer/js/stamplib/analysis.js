/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：分析公共脚本
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 13日
 ******************************************/

var bolonArr = []; //气泡数组
var htmlBalloonMove = null; //气泡
var AnalineObj = null; //分析线对象
var SurfaceAreaResult = null; //面积结果
var slopePolygonObj = null; //坡度图
var lineparam = null; //线惨数
var contourPolygonObj = null; //等高线
var heatMapPolygonObj = null; //热力图
var submergePolygon = null; //淹没分析
var submergeVec3s = null; //淹没分析多边形的vec3s
var differencePolygon = null; //区域监测多边形
var ispoint = false; //是否是点
var pointObj = null; //点对象
var minValue = 0; //坡度、区域返回最小值
var maxValue = 0; //坡度、区域返回最大值
var pointIcons = []; //通视分析生成的起始点目标点字样或者等高线生成的
if(!STAMP) {
	var STAMP = {};
}

STAMP.Analysis = function(earth) {
	var analysis = {};
	var _result = null; // 分析结果
	var _tempLayer = null; // 临时地形图层
	var _tempModel = null; // 临时填挖模型
	var extent = null;

	if(typeof SYSTEMPARAMS == 'undefined') {
		SYSTEMPARAMS = parent.SYSTEMPARAMS;
	}

	if(SYSTEMPARAMS && SYSTEMPARAMS.balloonAlpha && !isNaN(SYSTEMPARAMS.balloonAlpha)) {
		balloonAlpha = SYSTEMPARAMS.balloonAlpha;
	}

	/**
	 * 清除临时结果：绘制的辅助线、测量结果和分析结果
	 */
	var lightsightClear = false;
	var clearLinesight = function() {
		lightsightClear = true;
		clear();
	}

	/**
	 * 清除右键
	 * @param {Object} flag 标记
	 */
	function closePopups(flag) {
		clearGlobalBalloons();
		clear();
	}

	var resArr = [];
	/**
	 * 清除对象
	 */
	var clear = function() {
		if(earth == "" || earth == undefined) {
			return;
		}
		earth.ShapeCreator.Clear();
		earth.Measure.Clear();
		earth.TerrainManager.ClearTempLayer();
		hideBollon();
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
		//清除坡度图
		if(slopePolygonObj) {
			earth.DetachObject(slopePolygonObj);
			slopePolygonObj = null;
		}
		//清除等高线
		if(contourPolygonObj) {
			earth.DetachObject(contourPolygonObj);
			contourPolygonObj = null;
		};

		//清除热力图
		if(heatMapPolygonObj) {
			earth.DetachObject(heatMapPolygonObj);
			heatMapPolygonObj = null;
		};
		//清除淹没分析
		if(submergePolygon) {
			earth.DetachObject(submergePolygon);
			submergePolygon = null;
		}
		//清除通视分析
		if(elementLines) {
			for(var i = 0; i < elementLines.length; i++) {
				earth.DetachObject(elementLines[i]);
			}
			elementLines = [];
		}
		//清除区域监测图
		if(differencePolygon) {
			earth.DetachObject(differencePolygon);
			differencePolygon = null;
		}
		//清除通视分析生成的起始点目标点标注以及等高线产生的高度显示
		if(pointIcons) {
			for(var i = 0; i < pointIcons.length; i++) {
				earth.DetachObject(pointIcons[i]);
			}
			pointIcons = [];
		}
		earth.ShapeCreator.Clear();

	};

	/**
	 * 测量结果格式化，保留三位有效数字
	 */
	var _parseMeasureResult = function(mtype, resultHeader, result, type) {
		var unit = "";
		if(type === 9) { // 角度
			unit = "度";
		} else if(type === 4 || type === 7 || type === 8) { //投影面积测量、空间面积、立面面积
			unit = "平方千米";
			if(result < 1) {
				result = result * 1000000;
				unit = "平方米";
			}
		} else { //其它测量
			unit = "千米";
			if(result < 1) {
				result = result * 1000;
				unit = "米";
			}
		}
		return resultVal = resultHeader + "：" + result.toFixed(3) + unit;
	};

	/**
	 * 在球上以HtmlBalloon的形式显示测量结果
	 */
	var _showMeasureResult = function(result) {
		var bc = '#f4faff';
		var c = SYSTEMPARAMS.balloonAlpha == 0 ? '#0075C8' : '#FFFFFE';
		var html = "<html><body style='color: " + c + "; font-weight: bold; margin: 0; padding: 2px;'><p style='text-align:center;margin-top:30px;]' >" +
			result + "</p></body></html>";
		var id = earth.Factory.CreateGuid();
		var htmlBal = earth.Factory.CreateHtmlBalloon(id, "量算窗体");
		htmlBal.SetIsAddCloseButton(true);
		htmlBal.SetIsAddMargin(true);
		htmlBal.SetIsAddBackgroundImage(true);

		if(SYSTEMPARAMS.balloonAlpha == 0) {
			htmlBal.SetIsTransparence(false);
			htmlBal.SetScreenLocation(300 / 2 + 80, -20);
			htmlBal.SetRectSize(300, 150);
		} else {
			htmlBal.SetIsTransparence(true);
			htmlBal.SetBackgroundAlpha(0);
			htmlBal.SetRectSize(250, 150);
			htmlBal.SetScreenLocation(250 / 2 + 80, 0);
		}
		htmlBal.ShowHtml(html);
		bolonArr.push(htmlBal);
	};

	/**
	 * 隐藏气泡
	 */
	var hideBollon = function() {
		if(earth == null) {
			return;
		}
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
		if(AnalineObj) {
			earth.DetachObject(AnalineObj);
			AnalineObj = null;
		}
		bolonArr = [];
	}

	/**
	 * 测量：水平、垂直、空间距离，平面面积
	 * @param earth
	 * @param measureType
	 * @param callback 测量完成回调函数，如果为空，调用默认的回调函数，将测量结果在球上输出
	 */
	var measure = function(measureType, measureTitle, callback) {
		closePopups();
		hideBollon();
		earth.Event.OnMeasureFinish = function(result, type) {
			earth.ShapeCreator.Clear();
			if(callback && typeof callback == "function") {
				callback(_parseMeasureResult(measureType, measureTitle, result, type));
			} else {
				_showMeasureResult(_parseMeasureResult(measureType, measureTitle, result, type));
			}
			earth.Event.OnHtmlBalloonFinished = function() {
				clear();
			};
			earth.Event.OnMeasureFinish = function() {};
		};
		switch(measureType) {
			case "mHorizontalDist": //水平距离
				earth.Measure.MeasureHorizontalDistance();
				break;
			case "mHeight":
				earth.Measure.MeasureHeight();
				break;
			case "mArea":
				earth.Measure.MeasureArea();
				break;
			case "mSpatialArea":
				earth.Measure.MeasureSpatialArea();
				break;
			case "mVerticalArea":
				earth.Measure.MeasureVerticalArea();
				break;
			case "mPathLength":
				earth.Measure.MeasurePathLength(); // 球面距离
				break;
			case "mLineLength":
				earth.Measure.MeasureLineLength(); // 直线距离
				break;
			case "mPlaneAngle":
				earth.Measure.MeasurePlaneAngle(); // 平面角度
				break;
		}
	};

	/**
	 * 坡度测量：计算两点之间的坡度和坡角
	 */
	var measureSlope = function(callback) {
		hideBollon();
		earth.Event.OnCreateGeometry = function(pFeat) {
			var height = earth.GeometryAlgorithm.CalcHeight(pFeat);
			var length = earth.GeometryAlgorithm.CalculatePolylineLength(pFeat);
			var slope = height / (Math.sqrt(length * length - height * height));
			var angle = Math.atan(slope) * 180 / Math.PI;
			var result = "坡度：" + slope.toFixed(3) + "；坡角：" + angle.toFixed(1) + "°";
			if(callback && typeof callback == "function") {
				callback(result);
			} else {
				_showMeasureResult(result);
			}
		};
		earth.ShapeCreator.CreateLine();
	};

	/**
	 * 裁剪场景
	 * @param {Object} vertical  矢量对象
	 * @param {Object} types  类型
	 */
	var clipScene = function(vertical, types) {
		closePopups();
		hideBollon();
		earth.Event.OnMeasureFinish = function(result, type) {
			earth.Event.OnMeasureFinish = function() {};
			clear();
		};
		earth.Measure.ClipScene(vertical, types);
	}

	/**
	 * 最长日照时间测量
	 *btnObj:开始分析按钮;lightObj:日照时间框;month:月;day:日
	 *begin:开始时间;end:结束时间;acc:true累计有效日照,false连续有效日照
	 *resultCount:0所有时间段,2两个时间段,3三个时间段;stepObj:步长输入框
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

	/*---------通视分析开始--------*/
	var ares = []; //所有通视分析结果集合

	var elementLines = []; //通视分析生成的线数组
	
	//创建线
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
	var lineSight2Line = function(res) {
		res.ClearRes();
		resArr.push(res);
		var green = parseInt("0XFF00FF00");
		var red = parseInt("0XFFFF0000");
		var points = res.LineSightRes; // 结果三个点，如果后两个点坐标一致就是完全通视，不一致，则中间那个点是遮挡点，根据这个原则构建若干条不同颜色的element_line，我省略了，示例默认只建了一个

		var greenV3s = points.ToVector3s();
		greenV3s.Remove(2);
		var redV3s = points.ToVector3s();
		redV3s.Remove(0)
		var greenLine = createElementLine(greenV3s, green);
		var redLine = createElementLine(redV3s, red);
		var lastGeoPoint = points.GetPointAt(2);
		var groundAlt = earth.Measure.MeasureAltitude(lastGeoPoint.Longitude, lastGeoPoint.Latitude)
		var groundLineV3s = earth.Factory.CreateVector3s();
		groundLineV3s.Add(lastGeoPoint.Longitude, lastGeoPoint.Latitude, lastGeoPoint.Altitude);
		groundLineV3s.Add(lastGeoPoint.Longitude, lastGeoPoint.Latitude, groundAlt);
		createElementLine(groundLineV3s, parseInt("0xFFFFEB89"));
		ares[greenLine.Guid] = points;
		ares[redLine.Guid] = points;
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

	//创建起始点或目标点
	function CreatePointIcon(p, name) {
		var pointObj = earth.Factory.CreateElementIcon(earth.Factory.CreateGuid(), name);
		pointObj.Create(p.Longitude, p.Latitude, p.Altitude, "", "", name);
		pointObj.Visibility = true;
		earth.AttachObject(pointObj);
		pointIcons.push(pointObj);
		return pointObj;
	}
	var sel_line = null;
	//选取回调
	var on_select_changed = function(res) {
		if(earth.SelectSet.GetCount() > 0) {
			earth.Event.OnCreateGeometry = on_height_limit;
			if(earth.SelectSet.GetObject(0).Rtti != 220) { //220：线
				alert("请选择通视线！");
				return;
			}
			earth.ShapeCreator.HeightLimit(ares[earth.SelectSet.GetObject(0).Guid]);
			sel_line = earth.SelectSet.GetObject(0);
			earth.SelectSet.Clear();
		}
	}
	//选取完之后回调
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
	//创建视锥体
	function createViewshed(pval, angle, height, shadowColor, noShadowColor) {
		try {
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
		} catch(e) {
			alert("参数设置有误,请重新设置");
		}

	}

	/**
	 * 视域分析
	 * @param type 类型
	 * @param angle 视域角度
	 * @param height 视点高度
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
	 */
	var fixedObserver = function(height) {
		clear();
		earth.Event.OnCreateGeometry = function(pose) {
			earth.ShapeCreator.Clear();
			earth.Event.OnFixedPointObserveFinished = function() {
				clear();
				$("#btnStop").attr("disabled", "disabled");
				$("#btnStart").removeAttr("disabled");
				$("#height").removeAttr("disabled");
				$("#clear").removeAttr("disabled");
			};
			earth.GlobeObserver.FixedPointObserve(pose.Longitude, pose.Latitude, pose.Altitude, pose.heading, pose.tilt, pose.roll);
			$("#btnStop").removeAttr("disabled");
			earth.Event.OnCreateGeometry = function() {};
		};
		earth.ShapeCreator.createPose(height);
	};

	/**
	 * 天际线分析
	 */
	var skyline = function(type, height, dis, deep) {
		clear();
		earth.Event.OnCreateGeometry = function(line) {
			if(line.Count <= 0 || line.Length <= 0) { //无划线  防止直接结束地形消失
				clear();
				$("#btnStart").removeAttr("disabled");
				$("#mHeight").removeAttr("disabled");
				$("#btnStop").attr("disabled", "disabled");
				$("#chkUder").removeAttr("disabled");
				$("#chkDem").removeAttr("disabled");
				$("#length").removeAttr("disabled");
				$("#height").removeAttr("disabled");
				$("#clear").removeAttr("disabled");
				$("#deep").removeAttr("disabled");
				return;
			}
			earth.Event.OnFixedPointObserveFinished = function() {
				//右键操作后触发这里.
				clear();
				$("#btnStart").removeAttr("disabled");
				$("#mHeight").removeAttr("disabled");
				$("#btnStop").attr("disabled", "disabled");
				$("#chkUder").removeAttr("disabled");
				$("#chkDem").removeAttr("disabled");
				$("#length").removeAttr("disabled");
				$("#height").removeAttr("disabled");
				$("#clear").removeAttr("disabled");
				$("#deep").removeAttr("disabled");
				earth.Event.OnFixedPointObserveFinished = function() {};
			}
			lineparam = line;
			earth.ShapeCreator.Clear();
			earth.GlobeObserver.FixedPointObserveEx3(line, height, dis, deep, type, true);
			$("#btnStart").attr("disabled", "disabled");
			$("#mHeight").attr("disabled", "disabled");
			$("#btnStop").removeAttr("disabled");
			earth.Event.OnCreateGeometry = function() {};
		};
		earth.ShapeCreator.CreatePolyline(2, 16711680);
	};

	/**
	 * 阴影分析
	 * @param tz 时区
	 * @param d 日期
	 * @param t 时间
	 * @param tag 判断是否动态分析()
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
			if(elevationAngle && azimuthAngle)
				earth.Analysis.Shinning(elevationAngle, azimuthAngle, circle, 3);
		}
	};

	/**
	 * 获取时间
	 * @param {Object} date1  日期
	 * @param {Object} time1 时间
	 * @param {Object} step  步长
	 */
	var getDateTime = function(date1, time1, step) {
		var dates = date1.split("-");
		var times = time1.split(":");
		var curDate = new Date(dates[0], dates[1] - 1, dates[2], times[0], times[1], times[2]);
		curDate.setTime(curDate.getTime() + step * 60 * 1000);
		var year = curDate.getFullYear();
		var month = curDate.getMonth() + 1;
		var day = curDate.getDate();
		var hour = curDate.getHours();
		var minute = curDate.getMinutes();
		var second = curDate.getSeconds();
		var obj = {
			d: year + "-" + month + "-" + day,
			t: hour + ":" + minute + ":" + second
		}
		return obj;
	};

	/**
	 * 太阳
	 * @param d 日期
	 * @param t 时间
	 */
	var sun = function(d, t) {
		clear();
		earth.Event.OnAnalysisFinished = function(res) {
			_result = res;
			resArr.push(res);
		};
		var pose = earth.GlobeObserver.Pose;
		var currDateArr = d.split("-");
		var currTimeArr = t.split(":");
		// 根据日期和时间、地点计算太阳高度角和方位角
		var vector2 = earth.GeometryAlgorithm.CalculateSunElevationAndAzimuthAngle(8,
			currDateArr[0], currDateArr[1], currDateArr[2],
			currTimeArr[0], currTimeArr[1], currTimeArr[2],
			earth.GlobeObserver.TargetPose.Longitude, earth.GlobeObserver.TargetPose.Latitude);
		var elevationAngle = vector2.X;
		var azimuthAngle = vector2.Y;
		if(elevationAngle && azimuthAngle) {
			if(elevationAngle >= 0 && elevationAngle <= 180) {
				earth.Analysis.BeginShinLightAnaLysis(elevationAngle, azimuthAngle);
			} else {
				earth.Analysis.EndShinLightAnaLysis();
			}
		}
	};

	/**
	 * 获取高程
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

	/**
	 * 创建临时地形图层
	 */
	var _createNewLayer = function() {
		var tempDemPath = earth.Environment.RootPath + "\\temp\\terrain\\";
		var rect = earth.TerrainManager.GetTempLayerRect(); //获取临时地形范围，根据该范围生成临时地形图层
		var levelMin = earth.TerrainManager.GetTempLayerMinLevel();
		var levelMax = earth.TerrainManager.GetTempLayerMaxLevel();
		var guid = earth.Factory.CreateGUID();
		if(_tempLayer) {
			earth.DetachObject(_tempLayer);
			_tempLayer = null;
		}
		_tempLayer = earth.Factory.CreateDemLayer(guid, "TempTerrainLayer", tempDemPath, rect, levelMin, levelMax, 1000);
		earth.AttachObject(_tempLayer);
	};
	var getRootPath = function() {
		var pathName = window.document.location.pathname;
		var localhost = window.location.host;
		var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
		return(localhost + projectName);
	}

	/**
	 * 生成边缘模型
	 */
	var _createClipModel = function(args) {
		var modelGuid = earth.Factory.CreateGUID();
		var imgLocation = "http://" + getRootPath() + "/images/analysis/";
		var sideTexturePath = imgLocation + "profile.jpg";
		var buttomTexturePath = imgLocation + "bottom.jpg";
		var sampArgs = earth.TerrainManager.GenerateSampledCoordinates(args);
		_tempModel = earth.TerrainManager.GenerateClipModel(modelGuid, "ClipModel", args, sampArgs, sideTexturePath, sideTexturePath);
		earth.AttachObject(_tempModel);
	};

	var _createEcavAndFillLayer = function(args, alt, checked, digDemChecked) {
		var terrainArgs = earth.Factory.CreateVector3s();
		for(var i = 0; i < args.Count; i++) {
			var argsItem = args.Items(i);
			terrainArgs.Add(argsItem.X, argsItem.Y, alt);
		}

		earth.TerrainManager.SetMinClipLevel(11);

		//是否开挖地面模型
		if(!digDemChecked) {
			earth.TerrainManager.ClipTerrainByPolygon(terrainArgs, true);
		} else {
			_terrGuid = earth.Factory.CreateGUID();
			earth.TerrainManager.ClipTerrainByPolygonEx(_terrGuid, terrainArgs);
		}

		// 创建临时DEM图层
		_createNewLayer();

		//是否生成辅助模型
		if(checked) {
			_createClipModel(terrainArgs);
		}
	};

	var _vectorExcaveAndFill = function(pval, checked, digDemChecked) {
		clear();
		if(!pval || pval.count < 3) {
			$("#clear").removeAttr("disabled");
			return;
		}

		var terrainArgs = pval;
		earth.TerrainManager.SetMinClipLevel(11);
		if(!digDemChecked) { //是否开挖地面模型  ，，
			earth.TerrainManager.ClipTerrainByPolygon(terrainArgs, true);

		} else {
			_terrGuid = earth.Factory.CreateGUID();
			earth.TerrainManager.ClipTerrainByPolygonEx(_terrGuid, terrainArgs); //开挖地面模型
		}

		// 创建临时DEM图层
		_createNewLayer();

		if(checked) {
			_createClipModel(terrainArgs);
		}
		$("#btnStart").removeAttr("disabled");
		$("#clear").removeAttr("disabled")

		earth.Event.OnAnalysisFinished = function(result) { //处理挖填方分析结果
			var wf = result.Excavation.toFixed(2);
			$("#wafang").val(wf);
			$("#tianfang").val(result.Fill.toFixed(2));
		}
		earth.Analysis.VectorSurfaceExcavationAndFill(terrainArgs);
	}

	/**
	 * 挖填方分析
	 */
	var excavationAndFill = function(altitude, checked, digDemChecked, callback) {
		clear();
		earth.Event.OnCreateGeometry = function(pval, type) {
			if(pval.Count == 0) {
				$("#altitude").removeAttr("disabled");
				$("#clear").removeAttr("disabled");
				$("#btnStart").attr("disabled", false);
				return;
			}
			if(pval.Count < 3) {
				$("#altitude").removeAttr("disabled");
				$("#clear").removeAttr("disabled");
				$("#btnStart").attr("disabled", false);
				alert("多边形顶点数,必须大于2！请重新绘制！");
				earth.ShapeCreator.Clear();
				earth.ShapeCreator.CreatePolygon();
				return;
			}
			var altitudeGround = 0;
			var alt = 0;
			for(var i = 0; i < pval.Count; i++) {
				var argsItem = pval.Items(0);
				var a = earth.Measure.MeasureTerrainAltitude(argsItem.X, argsItem.Y)
				altitudeGround = a.toFixed(3);
			}
			alt = altitudeGround - altitude;
			earth.Event.OnAnalysisFinished = function(result, alt) {
				var res = "挖方：" + result.Excavation.toFixed(2) + "m<sup>3</sup>; " + "</br>" + " 填方：" + result.Fill.toFixed(2) + "m<sup>3</sup>";
				_result = result;
				var wf = result.Excavation.toFixed(2);
				$("#wafang").val(wf);
				$("#tianfang").val(result.Fill.toFixed(2));
				$("#altitude").removeAttr("disabled");
				$("#btnStart").removeAttr("disabled");
				$("#clear").removeAttr("disabled")
				earth.ShapeCreator.Clear();
				if(callback) {
					callback(res);
				}
			};
			_createEcavAndFillLayer(pval, alt, checked, digDemChecked);
			earth.Analysis.SurfaceExcavationAndFill(alt, pval);
			earth.Event.OnCreateGeometry = function() {};
		};
		setTimeout(function() { //延迟调用否则与OnHtmlBalloonFinished冲突f
			earth.ShapeCreator.CreatePolygon();
		}, 100);
	};

	/**
	 * 地表面积测量
	 */
	var measureSurfaceArea = function(callback) {
		hideBollon();
		earth.Event.OnCreateGeometry = function(polygon) {
			earth.Event.OnCreateGeometry = function() {};
			earth.Event.OnAnalysisFinished = function(result) {
				earth.Event.OnHtmlBalloonFinished = function() {
					clear();
				};
				earth.ShapeCreator.Clear();
				earth.Measure.Clear();
				var res = " 地表面积：" + result.TerrainSurfaceArea.toFixed(2) + "m<sup>2</sup>";
				// _result = result;
				SurfaceAreaResult = result;
				if(callback) {
					callback(res);
				} else {
					_showMeasureResult(res);
				}
			};
			earth.Analysis.SurfaceArea(polygon);
		};
		setTimeout(function() { //延迟否则与OnHtmlBalloonFinished冲突
			earth.ShapeCreator.CreatePolygon();
		}, 100);
	};
	/**
	 * 面面距离
	 */
	var SurfacesToSurfaces = function() {
		closePopups();
		hideBollon();
		var pointArr = [];
		var isPolygon = true;
		var lineObj;
		var polygonArr = [];
		var ispolygon = true;
		earth.ToolManager.SphericalObjectEditTool.Select();
		earth.Event.OnSelectChanged = function(x) {
			var selectSet = earth.SelectSet;
			if(selectSet.GetCount() == 0) {
				return;
			}
			for(var i = 0; i < selectSet.GetCount(); i++) {
				var element = selectSet.GetObject(i);
				if(element.Rtti === 211) { //211是polygon
					var vector3s = element.GetExteriorRing();
					pointArr.push(vector3s);
					polygonArr.push(element);
					element.ShowHighLight();
				} else {
					isPolygon = false;
				}
			}
			if(!isPolygon || pointArr.length > 2) {
				alert("选择对象不是面，请重新选择！");
				earth.ToolManager.SphericalObjectEditTool.Browse();
				isPolygon = true;
			} else {
				if(pointArr.length == 2) {
					var points = earth.Factory.CreateVector3s();
					var result = earth.GeometryAlgorithm.CalculatePolygonDistance(pointArr[0], pointArr[1]);
					if(result) {
						if(result.Length == 0) {
							pointArr = pointArr.splice(1, 1);
						}
						lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
						lineObj.BeginUpdate();
						lineObj.SetPointArray(result);
						lineObj.Visibility = true;
						var Linestyle = lineObj.LineStyle;
						Linestyle.LineWidth = 1;
						Linestyle.LineColor = parseInt(0xccff0000);
						lineObj.AltitudeType = 1;
						lineObj.EndUpdate();
						AnalineObj = lineObj;
						earth.AttachObject(lineObj);
						var length = result.Length;
						var showResult = "面面距离：" + length.toFixed(3) + "米";
						_showMeasureResult(showResult);
						pointArr = [];
						earth.ToolManager.SphericalObjectEditTool.Browse();
						earth.Event.OnSelectChanged = function(x) {};
					} else {
						if(ispolygon) {
							alert("您选择的面面相交或错误！");
							earth.ToolManager.SphericalObjectEditTool.Browse();
						}
					}
					polygonArr[0].StopHighLight();
					polygonArr[1].StopHighLight();
				}
			}
			earth.Event.OnRBDown = function() {
				ispolygon = false;
			}
		}
		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			clear();
			earth.SelectSet.Clear();
		};
	}
	/**
	 *点面距离
	 */
	var pointToSurfaces = function() {
		closePopups();
		hideBollon();
		var isPolygon = true;
		var lineObj;
		earth.Event.OnCreateGeometry = function(p, t) {
			if(p) {
				var pointArr = [];
				ispoint = true;
				var guid = earth.Factory.CreateGuid();
				var iconPath = earth.Environment.RootPath;
				var iconNormalFileName = iconPath + "icon" + "\\" + "flag1.png";
				var iconSelectedFileName = iconPath + "icon" + "\\" + "flag1.png";
				pointObj = earth.Factory.CreateElementIcon(guid, "point");
				pointObj.Create(p.Longitude, p.Latitude, p.Altitude, "", "", "point");
				pointObj.Visibility = true;
				earth.AttachObject(pointObj);
				earth.ShapeCreator.CreatePoint();
				earth.ToolManager.SphericalObjectEditTool.Select();
				earth.Event.OnSelectChanged = function(x) {
					var selectSet = earth.SelectSet;
					if(selectSet.GetCount() == 0) {
						return;
					}
					for(var i = 0; i < selectSet.GetCount(); i++) {
						var element = selectSet.GetObject(i);
						if(element.Rtti === 211) { //211是polygon
							var vector3s = element.GetExteriorRing();
							pointArr.push(vector3s);
							element.ShowHighLight();
						} else {
							isPolygon = false;
						}
					}
					if(!isPolygon || pointArr.length > 2) {
						alert("选择对象不是面，请重新选择！");
						earth.ToolManager.SphericalObjectEditTool.Browse();
						isPolygon = true;
					} else {
						var result = earth.GeometryAlgorithm.CalculatePointPolygonDistance(pointArr[0], p);
						if(result) {
							lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
							lineObj.BeginUpdate();
							lineObj.SetPointArray(result);
							lineObj.Visibility = true;
							var Linestyle = lineObj.LineStyle;
							Linestyle.LineWidth = 1;
							Linestyle.LineColor = parseInt(0xccff0000);
							lineObj.AltitudeType = 1;
							lineObj.EndUpdate();
							earth.AttachObject(lineObj);
							AnalineObj = lineObj;
							var length = result.Length;
							var showResult = "点面距离：" + length.toFixed(3) + "米";
							_showMeasureResult(showResult);
							pointArr = [];
							earth.ToolManager.SphericalObjectEditTool.Browse();
							earth.Event.OnSelectChanged = function(x) {};
						} else {
							alert("您选择的点面相交或错误！");
							earth.ToolManager.SphericalObjectEditTool.Browse();
						}
					}
					earth.DetachObject(pointObj);
					ispoint = false;
				}
			}
			earth.Event.OnRBDown = function() {
				pointClear();
				earth.Event.OnRBDown = function() {};
			}
		};
		hideBollon();
		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			earth.SelectSet.Clear();
			clear();
		};
		setTimeout(function() { //延迟否则与OnHtmlBalloonFinished冲突
			earth.ShapeCreator.CreatePoint();
		}, 100);
	}

	/**
	 *线面距离
	 */
	var lineToSurfaces = function() {
		closePopups();
		hideBollon();
		var isPolygon = true;
		var pointArr = [];
		var linevector3s = "";
		var polygonvector3s = "";
		var lineObj;
		var lineArr = [];
		earth.ToolManager.SphericalObjectEditTool.Select();
		earth.Event.OnSelectChanged = function(x) {
			var selectSet = earth.SelectSet;
			if(selectSet.GetCount() == 0) {
				return;
			}
			var tag = true;
			if(tag) {
				for(var i = 0; i < selectSet.GetCount(); i++) {
					var element = selectSet.GetObject(i);
					if(element.Rtti === 220) {
						linevector3s = element.GetPointArray();
						lineArr.push(element);
						element.ShowHighLight();
					} else
					if(element.Rtti === 211) { //211是polygon
						polygonvector3s = element.GetExteriorRing();
						lineArr.push(element);
						element.ShowHighLight();
					} else {
						isPolygon = false;
					}
				}
				if(!isPolygon) {
					alert("选择对象不是面或折线，请重新选择！");
					earth.ToolManager.SphericalObjectEditTool.Browse();
					isPolygon = true;
				} else {
					if(polygonvector3s && linevector3s) {
						var result = earth.GeometryAlgorithm.CalculateLinePolygonDistance(linevector3s, polygonvector3s);
						if(result) {
							lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
							lineObj.BeginUpdate();
							lineObj.SetPointArray(result);
							lineObj.Visibility = true;
							var Linestyle = lineObj.LineStyle;
							Linestyle.LineWidth = 1;
							Linestyle.LineColor = parseInt(0xccff0000);
							lineObj.AltitudeType = 5;
							lineObj.EndUpdate();
							earth.AttachObject(lineObj);
							AnalineObj = lineObj;
							var length = result.Length;
							var showResult = "线面距离：" + length.toFixed(3) + "米";
							_showMeasureResult(showResult);
							pointArr = [];
							earth.ToolManager.SphericalObjectEditTool.Browse();
							earth.Event.OnSelectChanged = function(x) {};
						} else {
							alert("您选择的线面相交或错误！");
							earth.ToolManager.SphericalObjectEditTool.Browse();
						}
						lineArr[0].StopHighLight();
						lineArr[1].StopHighLight();
					}
				}
			}
		}
		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			pointArr = [];
			clear();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			earth.SelectSet.Clear();
		};
	}
	/**
	 * 建筑物距离
	 */
	var buidTobuid = function() {

		closePopups();
		hideBollon();
		var modelArr = [];
		var isPolygon = true;
		var lineObj;
		var modelArr2 = [];
		earth.ToolManager.SphericalObjectEditTool.Select(); //获取SphericalObject编辑工具
		earth.Event.OnSelectChanged = function(x) {
			var selectSet = earth.SelectSet;
			if(selectSet.GetCount() == 0) {
				return;
			}
			for(var i = 0; i < selectSet.GetCount(); i++) {
				var element = selectSet.GetObject(i);
				if(element.Rtti === 223) { //  EditModel= 229,

					modelArr.push(element);
					element.ShowHighLight();
					modelArr2.push(element);
				} else {
					isPolygon = false;
				}
			}
			if(!isPolygon || modelArr.length > 2) {
				alert("请确定选择的模型！");
				earth.ToolManager.SphericalObjectEditTool.Browse();
				isPolygon = true;
			}
			if(modelArr.length == 2) {
				var buildingpolygonArr = [];
				for(var m = 0; m < modelArr.length; m++) {
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
						vector3s.AddVector(v3);
					}
					buildingpolygonArr.push(vector3s);
				}
				var result = earth.GeometryAlgorithm.CalculatePolygonDistance(buildingpolygonArr[0], buildingpolygonArr[1]);
				if(result) {
					var length = result.Length;
					var showResult = "楼间距：" + length.toFixed(3) + "米";
					_showMeasureResult(showResult);
					modelArr = [];
					earth.ToolManager.SphericalObjectEditTool.Browse();
				}
			}

		}
		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			clear();
			earth.SelectSet.Clear();
		};
	}

	/**
	 * 清除点
	 */
	var pointClear = function() {
		if(ispoint) {
			if(pointObj) {
				earth.DetachObject(pointObj);
			}
			ispoint = false;
		}
	}

	//点到折线距离
	var pointToline = function() {
		closePopups();
		hideBollon();
		var isPolygon = true;
		var lineObj;
		earth.Event.OnCreateGeometry = function(p, t) {
			if(p) {
				var pointArr = [];
				ispoint = true;
				var guid = earth.Factory.CreateGuid();
				var iconPath = earth.Environment.RootPath;
				var iconNormalFileName = iconPath + "icon" + "\\" + "flag1.png";
				var iconSelectedFileName = iconPath + "icon" + "\\" + "flag1.png";
				pointObj = earth.Factory.CreateElementIcon(guid, "point");
				pointObj.Create(p.Longitude, p.Latitude, p.Altitude, "", "", "point");
				pointObj.Visibility = true;
				earth.AttachObject(pointObj);
				earth.ShapeCreator.CreatePoint();
				earth.ToolManager.SphericalObjectEditTool.Select();
				earth.Event.OnSelectChanged = function(x) {
					var selectSet = earth.SelectSet;
					if(selectSet.GetCount() == 0) {
						return;
					}
					var element;
					for(var i = 0; i < selectSet.GetCount(); i++) {
						element = selectSet.GetObject(i);
						if(element.Rtti === 220) { //211是polygon
							var vector3s = element.GetPointArray();
							pointArr.push(vector3s);
							element.ShowHighLight();
						} else {
							isPolygon = false;
						}
					}
					if(!isPolygon || pointArr.length > 2) {
						alert("选择对象不是折线，请重新选择！");
						earth.ToolManager.SphericalObjectEditTool.Browse();
						isPolygon = true;
					} else {
						var vect3 = earth.Factory.CreateVector3();
						vect3.X = p.Longitude;
						vect3.Y = p.Latitude;
						vect3.Z = p.Altitude;
						var result = earth.GeometryAlgorithm.CalculatePointPolylineDistance(pointArr[0], p);
						if(result) {
							lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
							lineObj.BeginUpdate();
							lineObj.SetPointArray(result);
							lineObj.Visibility = true;
							var Linestyle = lineObj.LineStyle;
							Linestyle.LineWidth = 1;
							Linestyle.LineColor = parseInt(0xccff0000);
							lineObj.AltitudeType = 1;
							lineObj.EndUpdate();
							earth.AttachObject(lineObj);
							AnalineObj = lineObj;
							var length = result.Length;
							var showResult = "点线距离：" + length.toFixed(3) + "米";
							_showMeasureResult(showResult);
							pointArr = [];
							earth.ToolManager.SphericalObjectEditTool.Browse();
							earth.Event.OnSelectChanged = function(x) {};
						}
						earth.DetachObject(pointObj);
						ispoint = false;
					}
				}
				earth.Event.OnRBDown = function() {
					pointClear();
					earth.Event.OnRBDown = function() {};
				}
			}
		};

		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			earth.SelectSet.Clear();
			clear();
			earth.Event.OnHtmlBalloonFinished = function() {};
		};

		setTimeout(function() { //延迟否则与OnHtmlBalloonFinished冲突
			earth.ShapeCreator.CreatePoint();
		}, 100);
	}
	//点-线段距离
	var pointToZline = function() {
		closePopups();
		hideBollon();
		var isPolygon = true;
		var lineObj;
		earth.Event.OnCreateGeometry = function(p, t) {
			if(p) {
				var pointArr = [];
				ispoint = true;
				var guid = earth.Factory.CreateGuid();
				pointObj = earth.Factory.CreateElementIcon(guid, "point");
				pointObj.Create(p.Longitude, p.Latitude, p.Altitude, "", "", "point");
				pointObj.Visibility = true;
				earth.AttachObject(pointObj);
				earth.ShapeCreator.CreatePoint();
				earth.ToolManager.SphericalObjectEditTool.Select();
				earth.Event.OnSelectChanged = function(x) {
					var selectSet = earth.SelectSet;
					if(selectSet.GetCount() == 0) {
						return;
					}
					var vector3s
					for(var i = 0; i < selectSet.GetCount(); i++) {
						var element = selectSet.GetObject(i);
						if(element.Rtti === 220) { //211是polygon
							vector3s = element.GetPointArray();
							pointArr.push(vector3s);
							element.ShowHighLight();
						} else {
							isPolygon = false;
						}
					}
					if(!isPolygon || pointArr.length > 2 || vector3s.Count > 2) {
						alert("选择对象不是直线，请重新选择！");
						earth.ToolManager.SphericalObjectEditTool.Browse();
						isPolygon = true;
					} else {
						var vect3 = earth.Factory.CreateVector3();
						vect3.X = p.Longitude;
						vect3.Y = p.Latitude;
						vect3.Z = p.Altitude;
						var result = earth.GeometryAlgorithm.DistancePointLine(pointArr[0].Items(0), pointArr[0].Items(pointArr[0].Count - 1), vect3);
						if(result) {
							lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
							lineObj.BeginUpdate();
							lineObj.SetPointArray(result);
							lineObj.Visibility = true;
							var Linestyle = lineObj.LineStyle;
							Linestyle.LineWidth = 1;
							Linestyle.LineColor = parseInt(0xccff0000);
							lineObj.AltitudeType = 1;
							lineObj.EndUpdate();
							earth.AttachObject(lineObj);
							AnalineObj = lineObj;
							var length = result.Length;
							var showResult = "点线距离：" + length.toFixed(3) + "米";
							_showMeasureResult(showResult);
							pointArr = [];
							earth.ToolManager.SphericalObjectEditTool.Browse();
							earth.Event.OnSelectChanged = function(x) {};

						}
					}
					earth.DetachObject(pointObj);
					ispoint = false;
				}
				earth.Event.OnRBDown = function() {
					pointClear();
					earth.Event.OnRBDown = function() {};
				}
			}
		};
		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			clear();
			earth.SelectSet.Clear();
		};
		setTimeout(function() { //延迟否则与OnHtmlBalloonFinished冲突
			earth.ShapeCreator.CreatePoint();
		}, 100);
	}
	//点-线段距离
	var pointToSegment = function() {
		closePopups();
		hideBollon();
		var isPolygon = true;
		var lineObj;
		earth.Event.OnCreateGeometry = function(p, t) {
			var pointArr = [];
			earth.ToolManager.SphericalObjectEditTool.Select();
			earth.Event.OnSelectChanged = function(x) {
				var selectSet = earth.SelectSet;
				if(selectSet.GetCount() == 0) {
					return;
				}
				for(var i = 0; i < selectSet.GetCount(); i++) {
					var element = selectSet.GetObject(i);
					if(element.Rtti === 220) { //211是polygon
						var vector3s = element.GetPointArray();
						pointArr.push(vector3s);
					} else {
						isPolygon = false;
					}
				}
				if(!isPolygon || pointArr.length > 2) {
					alert("请确定选择的是线！");
					earth.ToolManager.SphericalObjectEditTool.Browse();
					isPolygon = true;
				} else {
					var vect3 = earth.Factory.CreateVector3();
					vect3.X = p.Longitude;
					vect3.Y = p.Latitude;
					vect3.Z = p.Altitude;
					var result = earth.GeometryAlgorithm.DistancePointSegment(pointArr[0].Items(0), pointArr[0].Items(pointArr[0].Count - 1), vect3);
					if(result) {
						lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
						lineObj.BeginUpdate();
						lineObj.SetPointArray(result);
						lineObj.Visibility = true;
						var Linestyle = lineObj.LineStyle;
						Linestyle.LineWidth = 1;
						Linestyle.LineColor = parseInt(0xccff0000);
						lineObj.AltitudeType = 1;
						lineObj.EndUpdate();
						earth.AttachObject(lineObj);
						AnalineObj = lineObj;
						var length = result.Length;
						var showResult = "点线距离：" + length.toFixed(3) + "米";
						_showMeasureResult(showResult);
						pointArr = [];
						earth.ToolManager.SphericalObjectEditTool.Browse();
						earth.Event.OnSelectChanged = function(x) {};
					}
				}
			}

		};
		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			clear();
			earth.SelectSet.Clear();
		};
		setTimeout(function() { //延迟否则与OnHtmlBalloonFinished冲突
			earth.ShapeCreator.CreatePoint();
		}, 100);
	};
	//线线距离x
	var lineToline = function() {
		closePopups();
		hideBollon();
		var pointArr = [];
		var isPolygon = true;
		var lineObj;
		var lineArr = [];
		var isline = true;
		earth.ToolManager.SphericalObjectEditTool.Select();
		earth.Event.OnSelectChanged = function(x) {
			var selectSet = earth.SelectSet;
			if(selectSet.GetCount() == 0) {
				return;
			}
			for(var i = 0; i < selectSet.GetCount(); i++) {
				var element = selectSet.GetObject(i);
				if(element.Rtti === 220) { //211是polygon
					var vector3s = element.GetPointArray();
					pointArr.push(vector3s);
					lineArr.push(element);
					element.ShowHighLight();
				} else {
					isPolygon = false;
				}
			}
			if(!isPolygon || pointArr.length > 2) {
				alert("选择对象不是折线，请重新选择！");
				earth.ToolManager.SphericalObjectEditTool.Browse();
				isPolygon = true;
			} else {
				if(pointArr.length == 2) {
					var points = earth.Factory.CreateVector3s();
					var result = earth.GeometryAlgorithm.CalculateLineLineDistance(pointArr[0], pointArr[1]);
					if(result) {
						if(result.Length == 0) {
							pointArr = pointArr.splice(1, 1);
						}
						lineObj = earth.Factory.CreateElementLine(earth.Factory.CreateGUID(), "line");
						lineObj.BeginUpdate();
						lineObj.SetPointArray(result);
						lineObj.Visibility = true;
						var Linestyle = lineObj.LineStyle;
						Linestyle.LineWidth = 1;
						Linestyle.LineColor = parseInt(0xccff0000);
						lineObj.AltitudeType = 1;
						lineObj.EndUpdate();
						earth.AttachObject(lineObj);
						AnalineObj = lineObj;
						var length = result.Length;
						var showResult = "线线距离：" + length.toFixed(3) + "米";
						_showMeasureResult(showResult);
						pointArr = [];
						earth.ToolManager.SphericalObjectEditTool.Browse();
						earth.Event.OnSelectChanged = function(x) {};
					} else {
						if(isline) {
							alert("您选择的线相交或错误！");
							earth.ToolManager.SphericalObjectEditTool.Browse();
						}
					}
					lineArr[0].StopHighLight();
					lineArr[1].StopHighLight();
				}
			}
			earth.Event.OnRBDown = function() {
				isline = false;
			}
		};
		earth.Event.OnHtmlBalloonFinished = function() {
			earth.ToolManager.SphericalObjectEditTool.Browse();
			earth.Event.OnSelectChanged = function(x) {};
			if(lineObj) {
				earth.DetachObject(lineObj);
			}
			clear();
			earth.SelectSet.Clear();
		};
	};
	/**
	 * 弹出功能气泡框
	 * @param  {[type]} anaLysisChk [功能菜单ID]
	 * @return {[type]}             [description]
	 */
	var showMoveHtml = function(anaLysisChk) {
		earth.Event.OnHtmlNavigateCompleted = function() {};
		var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
		var url = "";
		var width = 280,
			height = 220;

		if(anaLysisChk === "mLineSight") { //通视分析
			url = loaclUrl + "/html/analysis/linesight.html"; //ShowNavigate只能用绝对路径
			width = 270;
			height = 183;
		} else if(anaLysisChk === 'dViewshed') { //动态视域
			url = loaclUrl + '/html/analysis/dviewshed.html';
			width = 288;
			height = 507;
		} else if(anaLysisChk === 'historyNoSlider') { //历史查看
			url = loaclUrl + '/html/analysis/history.html';
			width = 220;
			height = 141;
		} else if(anaLysisChk === 'slopePoint') { //坡度分析
			url = loaclUrl + '/html/analysis/slopePoint.html';
			width = 270;
			height = 140;
		} else if(anaLysisChk === 'slopePolygon') { //坡度图
			url = loaclUrl + '/html/analysis/slopePolygon.html';
			width = 320;
			height = 296;
		} else if(anaLysisChk === "mViewshed") { //视域分析
			url = loaclUrl + "/html/analysis/viewshed.html";
			width = 274;
			height = 267;
		} else if(anaLysisChk === "mSkyline") { //天际线
			url = loaclUrl + "/html/analysis/skyline.html";
			width = 348;
			height = 308;
		} else if(anaLysisChk === "") {
			url = loaclUrl + "/html/analysis/shinning.html";
		} else if(anaLysisChk === "mFixedObserver") { //视野分析
			url = loaclUrl + "/html/analysis/pointview.html";
			width = 270;
			height = 142;
		} else if(anaLysisChk === "mInsolation") { //日照分析
			url = loaclUrl + "/html/analysis/insolation.html";
			width = 270;
			height = 438;
		} else if(anaLysisChk === "mShinning") { //阴影分析
			url = loaclUrl + "/html/analysis/shinning.html";
			width = 270;
			height = 266;
		} else if(anaLysisChk === "mExcavationAndFill") { //挖填方分析
			url = loaclUrl + "/html/analysis/excavationAndFill.html";
			width = 350;
			height = 284;
		} else if(anaLysisChk === "submerge") { //点源淹没
			url = loaclUrl + "/html/analysis/submerge.html";
			width = 340;
			height = 411;
		} else if(anaLysisChk === "bestPath") { //地形路径
			url = loaclUrl + "/html/analysis/best_path.html";
			width = 250;
			height = 184;
		} else if(anaLysisChk === "profile") { //地形剖面
			url = loaclUrl + "/html/analysis/profile.html";
			width = 270;
			height = 141;
		} else if(anaLysisChk === "importVector") { //导入导出
			url = loaclUrl + "/html/userdata/importVector.html";
			width = 320;
			height = 184;
		} else if(anaLysisChk === "exportSHP") {
			url = loaclUrl + "/html/userdata/exportSHP.html";
			width = 294;
			height = 297;
		} else if(anaLysisChk === "terrainSmooth") { //地形平整
			url = loaclUrl + "/html/userdata/terrainSmooth.html";
			height = 143;
			width = 285;
		} else if(anaLysisChk === "importBuilding") { //导入楼块
			url = loaclUrl + "/html/userdata/importBuilding.html";
			height = 311;
			width = 323;
		} else if(anaLysisChk === "importModel") { //导入模型
			url = loaclUrl + "/html/userdata/importUSB.html";
			height = 185;
			width = 323;
		} else if(anaLysisChk === "importAnimate") {
			url = loaclUrl + "/html/userdata/importAnimate.html";
			height = 170;
		} else if(anaLysisChk === "exportObj") { //导出obj
			url = loaclUrl + "/html/userdata/exportObj.html";
			height = 213;
			width = 323;
		} else if(anaLysisChk === "exportUSX") { //导出usx-暂时未用到，后面看需求
			url = loaclUrl + "/html/userdata/exportUsx.html";
			height = 213;
			width = 323;
		} else if(anaLysisChk === "coordlocation") {
			url = loaclUrl + "/html/search/coordLocation.html";
			width = 242;
			height = 213;
		} else if(anaLysisChk === "clipScene") { //设置剖面分析展示页面
			url = loaclUrl + "/html/analysis/clipscene.html";
			width = 300;
			height = 200;
		} else if(anaLysisChk === "waterground") { //设置淹没分析展示页面
			url = loaclUrl + "/html/analysis/waterground.html";
			width = 340;
			height = 420;
		} else if(anaLysisChk === "heatMapPolygon") { //热力图
			url = loaclUrl + "/html/analysis/heat_map.html"
			width = 320;
			height = 508;
		} else if(anaLysisChk == "contourPolygon") { //等高线
			url = loaclUrl + "/html/analysis/contour.html";
			width = 320;
			height = 268;
		} else if(anaLysisChk == "landSlideAnalysis") { //滑坡分析
			url = loaclUrl + "/html/analysis/landSlideAnalysis.html";
			width = 304;
			height = 394;
		} else if(anaLysisChk == "sectionMonitor") { //断面监测
			url = loaclUrl + "/html/analysis/sectionMonitor.html";
			width = 272;
			height = 315;
		} else if(anaLysisChk == "pointMonitor") { //单点监测
			url = loaclUrl + "/html/analysis/pointMonitor.html";
			width = 250;
			height = 238;
		} else if(anaLysisChk == "areaMonitor") { //区域监测
			url = loaclUrl + "/html/analysis/areaMonitor.html";
			width = 310;
			height = 460;
		}
		if(url === "") {
			return;
		}
		clearGlobalBalloons();
		htmlBalloonMove = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), "屏幕坐标窗体");
		var locationWidth = width / 2 + 80;
		htmlBalloonMove.SetScreenLocation(locationWidth, 0);
		htmlBalloonMove.SetRectSize(width, height);
		htmlBalloonMove.SetIsAddBackgroundImage(false);
		htmlBalloonMove.ShowNavigate(url);
		earth.Event.OnDocumentReadyCompleted = function(guid) {
			earth.htmlBallon = htmlBalloonMove;
			earth.analysisObj = top.analysis;
			earth.ifEarth = window;
			earth.userdata = userdata;
			earth.spatial = STAMP_config.spatial;
			earth.datum = CoordinateTransform.sysDatum;
			earth.demArr = LayerManagement.demArr;
			earth.projectId = SYSTEMPARAMS.project;
			earth.Tools = Tools;
			try {
				if(top.getOperObject() && top.getOperObject().$("#userDataTree")) {
					earth.tempUserdataTree = top.getOperObject().$.fn.zTree.getZTreeObj("userDataTree");
				}
			} catch(e) {
				earth.tempUserdataTree = null;
			}

			if(htmlBalloonMove === null) {
				return;
			}
			if(htmlBalloonMove.Guid == guid) {
				htmlBalloonMove.InvokeScript("getEarth", earth);
				htmlBalloonMove.InvokeScript("getUserData", parent.STAMP.Userdata());
			}
		};
		earth.Event.OnHtmlBalloonFinished = function(id) {
			if(htmlBalloonMove != null && id === htmlBalloonMove.Guid) {
				Tools.singleStyleCancel(anaLysisChk);
				htmlBalloonMove.DestroyObject();
				htmlBalloonMove = null;
				earth.Event.OnHtmlBalloonFinished = function() {};
			}
		};
	};
	/**
	 * 清除气泡
	 * @param {Object} htmlBall  气泡
	 */
	var clearHtmlBallon = function(htmlBall) {
		if(htmlBall != null) {
			htmlBall.DestroyObject();
			htmlBall = null;
		}
	};
	/*-----------------淹没分析start------------------*/
	//根据圆获得vecter3s对象
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
	//vec3s:创建淹没水面的空间对象,vector3s;subwater1,水底高程,如果不是动态模拟为null,
	//waterHeight:目标水深+水底高程;time:淹没时间,isShowSide:是否显示侧面,水面边界延伸到地面
	var createSubmergePolygon = function(vec3s, subwater1, waterHeight, time, isShowSide) {
		if(!vec3s) {
			vec3s = submergeVec3s;
		} else {
			submergeVec3s = vec3s;
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
		if(time) { //动态模拟
			submergePolygon.SetParam(subwater1, waterHeight, time);
		} else { //直接分析的结果
			submergePolygon.SetParam(subwater1, waterHeight, 0.01);
		}
		submergePolygon.Wave = 100;
		submergePolygon.Start();
		$("#btnSimulation").attr("disabled", false);
	}
	//根据折线得到缓冲面v3s
	var getBufferVector3s = function(lineGeoPoints, waterHeight, buffer) {
		var v3s = earth.Factory.CreateVector3s();
		var bufGeoPoints = earth.GeometryAlgorithm.CreatePolygonFromPolylineAndWidth(lineGeoPoints, buffer, buffer);
		for(var i = 0; i < bufGeoPoints.Count; i++) {
			pt = bufGeoPoints.GetPointAt(i);
			v3s.Add(pt.Longitude, pt.Latitude, waterHeight);
		}
		return v3s;
	}
	//根据绘制的多边形获取外扩多边形ve3
	var getPolygonVec3s = function(polygonVec3s, waterHeight, buffer) {
		var parallelPolygonVec3s = earth.GeometryAlgorithm.CreateParallelPolygon(polygonVec3s, buffer, 1);
		for(var i = 0; i < parallelPolygonVec3s.Count; i++) {
			parallelPolygonVec3s.Items(i).Z = waterHeight;
		}
		return parallelPolygonVec3s;
	}
	//得到淹没面积填充到界面中
	//res:分析得到的结果
	function getSubmergeArea(res) {
		var elementArea = 0;
		var elementWaterCount = res.GetGeometryWaterCount();
		for(var i = 0; i < elementWaterCount; i++) {
			var thisElementWater = res.GetGeometryWater(i);
			var thisArea = thisElementWater.Area;
			elementArea += thisArea;
		}
		elementArea = elementArea.toFixed(2);
		$("#subWaterArea").val(elementArea);
	}

	function showSide(isShowSide) {
		if(submergePolygon) {
			submergePolygon.ShowSide = isShowSide;
			if(isShowSide) {
				submergePolygon.SideColor = parseInt("0xff00A2E8")
			}
		}
	}
	//点源淹没
	var submergePoint = function(subwater1, waterHeight, time, isShowSide) {
		earth.Event.OnAnalysisFinished = function(res) {
			getSubmergeArea(res);
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

			createSubmergePolygon(vec3s, subwater1, waterHeight, time, isShowSide);
			earth.Analysis.Submerge(waterHeight, p);
		};
		earth.ShapeCreator.CreateCircle();

	}
	//流域分析
	var submergeLine = function(subwater1, waterHeight, time, isShowSide, buffer) {
		earth.Event.OnAnalysisFinished = function(res) {
			getSubmergeArea(res);
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
			createSubmergePolygon(vec3s, subwater1, waterHeight, time, isShowSide)
		}
		earth.ShapeCreator.CreatePolyline(0, 0xcc111111);
	}
	//面域分析
	var submergePolygons = function(subwater1, waterHeight, time, isShowSide, buffer) {
		earth.Event.OnAnalysisFinished = function(res) {
			getSubmergeArea(res);
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
			createSubmergePolygon(vec3s, subwater1, waterHeight, time, isShowSide);
		}
		earth.ShapeCreator.CreatePolygon();
	}
	/*-----------------淹没分析end------------------*/

	//地形路径分析
	var bestPath = function(climbLimited, descentLimited, btn) {
		earth.Event.OnAnalysisFinished = function(res) {
			earth.Event.OnAnalysisFinished = function() {};
			if(earth.htmlBallon.Guid) {
				_result = res;
				for(var i = 0; i < btn.length; i++) {
					btn[i].removeAttr("disabled");
				}
			} else {
				clear();
				res.ClearRes();
				_result = null;
			}
		};
		earth.ShapeCreator.pickState = 0;
		earth.Event.OnCreateGeometry = function(p, cType) {
			earth.ShapeCreator.Clear();
			earth.Analysis.BestPath(climbLimited, descentLimited, p);
		};
		earth.ShapeCreator.CreateLine();
	}
	//阴影分析
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

	//阴影动态模拟结束事件
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

				//endTimeTag = st;
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
	 * @param {Object} now  当前时间
	 * @param {Object} btn1  按钮
	 * @param {Object} dqdate  当前日期
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
	 * 获取表数组
	 * @param {Object} tableId 表id
	 */
	function getTableArr(tableId) {
		var tableArr = []
		$("#" + tableId + " tr").each(function(i) {
			$(this).children("td").each(function(j) {
				if(j != 0) {
					tableArr.push($(this).children("input").get(0).value);
				} else {
					tableArr.push($(this).text());
				}
			});
		});
		return tableArr;
	}
	//热力图
	function createHeatMap(filePath, radius, density, altitude, terrain, tableId) {
		clear();
		if(heatMapPolygonObj == null) {
			heatMapPolygonObj = earth.Factory.CreateElementHeatMapPolygon(earth.Factory.CreateGuid(), 'heatMap');
			earth.AttachObject(heatMapPolygonObj);
		}

		heatMapPolygonObj.BeginUpdate();
		heatMapPolygonObj.Radius = radius;
		heatMapPolygonObj.Density = density;
		heatMapPolygonObj.Altitude = altitude;
		if(terrain) {
			heatMapPolygonObj.AltitudeType = 1;
		} else {
			heatMapPolygonObj.AltitudeType = 0;
		}
		heatMapPolygonObj.DataPath = filePath;
		var tableArr = getTableArr(tableId);
		for(var i = 0; i < tableArr.length; i += 2) {
			var color = tableArr[i + 1];
			var newColor = color.replace("#", "0x00");
			heatMapPolygonObj.AddGrade(tableArr[i], parseInt(newColor));
		}
		heatMapPolygonObj.EndUpdate();
		var bound = heatMapPolygonObj.LonLatRect;
		var center = bound.Center;
		earth.GlobeObserver.GotoLookat(center.X, center.Y, 100, 0, 40, 0, 1000);
	}
	/**
	 * 权值分段
	 * @return {[type]}     [description]
	 */
	function section(setColor) {
		var color = ["#00ff00", "#ff0000", "#ffff00", "#0000ff", "#660033", "#990099", "#996600", "#cc0099", "#cc6600", "#330000"]
		if(setColor) {
			color = setColor;
		}
		var gradeSection = $('#gradeSection').val();
		if(gradeSection == "" || parseInt(gradeSection) < 2 || gradeSection > 10) {
			alert("值域为[2-10],请重新输入！");
			$('#gradeSection').val(2);
			return;
		} else {
			$("#btnSet").attr("disabled", false);
		}
		var secAngle = parseFloat(1 / (gradeSection - 1)).toFixed(2);
		$("#slopeTable").empty();
		var maxMinusMin = maxValue - minValue;
		var perDiff = maxMinusMin / (gradeSection - 1);

		for(var i = 0; i < gradeSection; i++) {
			if(i == gradeSection - 1) {
				var thisGrade = maxValue;
			} else {
				var thisGrade = minValue + i * perDiff;
			}
			var trHTML = "<tr><td>" + thisGrade.toFixed(2) + "</td><td>" +
				"<input type='text' id='fillColor" + i + "' value='" + color[i] + "' class='colorInput' readonly/>" +
				"<input type='button' id='fillColorSel" + i + "' class='colorBtn' style='background-color:" + color[i] + "' " +
				"value='' onClick='fillColorDlg(" + '"fillColorSel' + i + '")' + "' /></td></tr>";
			$(trHTML).appendTo("#slopeTable");
		}

		$("#slopeTable td").css({
			"width": "60px",
			"overflow": "hidden",
			"white-space": "nowrap",
			"word-break": "keep-all"
		});
	}
	/**
	 * 坡度图、区域监测绘制后得到最大最小值以及更改取值表格的值
	 * @param  {[object]} thisPolygon  [区域监测或者坡度图]
	 * @param  {[str]} tableId [取值table的id]
	 */
	function getMinMaxValue(thisPolygon, setColor) {
		thisPolygon.UpdateMinMax();
		minValue = thisPolygon.GetMinValue();
		maxValue = thisPolygon.GetMaxValue();
		$("#sectionBtn").removeAttr("disabled");
		$("#btnStart").removeAttr("disabled");
		section(setColor);
	}
	//坡度图
	function slope(setColor) {
		analysis.clear();
		$("#btnStart, #sectionBtn").attr("disabled", true);
		earth.Event.OnCreateGeometry = function(pVal) {
			earth.Event.OnCreateGeometry = $.noop;
			if(pVal.Count <= 2) {
				alert("请至少绘制3个点！");
				earth.ShapeCreator.Clear();
				return;
			}
			slopePolygonObj = earth.Factory.CreateElementSlopePolygon(earth.Factory.CreateGuid(), 'slope');
			slopePolygonObj.BeginUpdate();
			slopePolygonObj.SetExteriorRing(pVal);
			slopePolygonObj.SetTransparent(200);
			slopePolygonObj.EndUpdate();
			getMinMaxValue(slopePolygonObj, setColor);
		};
		earth.ShapeCreator.CreatePolygon();
	}
	/**
	 * 区域监测绘制,并且得到最大最小值
	 * @param  {[str]} serverIp [服务器ip]
	 * @param  {[str]} strGuid1 [监测地形1的dem图层guid]
	 * @param  {[str]} strGuid2 [监测地形2的dem图层guid]
	 */
	function difference(serverIp, strGuid1, strGuid2, setColor) {
		analysis.clear();
		$("#btnStart,#sectionBtn").attr("disabled", true);
		earth.Event.OnCreateGeometry = function(pVal) {
			earth.Event.OnCreateGeometry = $.noop;
			if(pVal.Count <= 2) {
				alert("请至少绘制3个点！");
				earth.ShapeCreator.Clear();
				return;
			}
			var guid = earth.Factory.CreateGUID();
			differencePolygon = earth.Factory.CreateElementHeightDiffPolygon(guid, "diffPolygon", serverIp, strGuid1, strGuid2)
			differencePolygon.BeginUpdate();
			differencePolygon.SetExteriorRing(pVal);
			differencePolygon.SetTransparent(200);
			differencePolygon.EndUpdate();
			getMinMaxValue(differencePolygon, setColor);
		};
		earth.ShapeCreator.CreatePolygon();
	}
	/**
	 * 给区域监测多边形或者坡度多边形着色
	 * @param  {[object]} thisPolygon [区域监测图或者坡度图对象]
	 * @return {[type]}             [description]
	 */
	function colorPolygon(thisPolygon) {
		var gradeSection = $('#gradeSection').val();
		var maxMinusMin = maxValue - minValue;
		var perDiff = maxMinusMin / (gradeSection - 1);
		thisPolygon.AltitudeType = 1;
		for(var i = 0; i < gradeSection; i++) {
			var thisGradeIndex = 2 * i;
			var thisTdIndex = 2 * i + 1;
			var thisGrade = minValue + i * perDiff;
			var thisGradeColor = $("#slopeTable td:eq(" + thisTdIndex + ") input:text").val();
			thisGradeColor = "0x" + thisGradeColor.substr(1, 6);
			thisPolygon.AddGrade(thisGrade, parseInt(thisGradeColor));
		}
		earth.AttachObject(thisPolygon);
		var filePath = $("#filePath").val();
		if(!filePath) { //只有区域监测才能保存对比图
			return;
		} else {
			earth.UserDocument.DeleteFile(filePath);
			setTimeout(function() {
				thisPolygon.SavePic(filePath); //保存对比图
			}, 400)
		}
	}
	//等高线实现方法
	function contour(stride, color, obj) {
		clear();
		earth.Event.OnCreateGeometry = function(pVal) {
			earth.Event.OnCreateGeometry = $.noop;

			if(pVal.Count <= 2) {
				alert("请至少绘制3个点！");
				earth.ShapeCreator.Clear();
				return;
			}

			contourPolygonObj = earth.Factory.CreateElementContourPolygon(earth.Factory.CreateGuid(), 'contour');
			contourPolygonObj.BeginUpdate();
			contourPolygonObj.SetExteriorRing(pVal);
			contourPolygonObj.AltitudeType = 1;
			contourPolygonObj.EndUpdate();

			earth.AttachObject(contourPolygonObj);
			if(stride && contourPolygonObj) {
				contourPolygonObj.SetStride(stride);
			}
			if(color && contourPolygonObj) {
				contourPolygonObj.SetColor(color);
			}
			//等高线绘制完成之后给数字
			earth.Event.OnContourProcessFinish = function(){
				if(pointIcons && pointIcons.length > 0){
					for(var i = 0; i < pointIcons.length; i++){
						if(pointIcons[i]){
							earth.DetachObject(pointIcons[i]);
							pointIcons[i] = null;
						}
					}
				}
				pointIcons = [];
			    var contourcount = contourPolygonObj.GetContourCount();
                for (var i = contourcount - 1; i >= 0; i--) {
	                var contourdata = contourPolygonObj.GetContourBynNum(i);
	                var geoPoint = contourdata.ToGeoPoints();
	                var v_pos =  geoPoint.GetPointAt(0);
	                var v_height = v_pos.Altitude;
	                CreatePointIcon(v_pos, "高度:" + v_height.toFixed(3) + "m");
                }
			}
			obj.attr("disabled", false);
		};
		earth.ShapeCreator.CreatePolygon();
	}
	//风场分析
	var windScene = function(path, layers, x, y) {
		hideBollon();

		earth.Event.OnMeasureFinish = function(result, type) {
			clear();
		};
		setTimeout(function() { //延迟否则与OnHtmlBalloonFinished冲突
			earth.Measure.WindScene(path, layers, x, y);
		}, 100);
	}
	//获取文件夹下子目录数量
	var GetWindSceneLayersCount = function(path) {
		var count = earth.Measure.GetWindSceneLayersCount(path);
		return count;
	}
	//获取文件夹下子目录
	var GetWindSceneLayers = function(path, arraylayers, nCount) {
		nCount = earth.Measure.GetWindSceneLayers(path, arraylayers);
	}

	/**
	 * 显示图例
	 * @param {Object} htmlStr 图例气泡
	 */
	function showLegend(htmlStr) {
		var balloon;
		earth.Event.OnHtmlBalloonFinished = function() {
			if(slopePolygonObj) {
				earth.DetachObject(slopePolygonObj);
				earth.ShapeCreator.Clear();
			}
			earth.Event.OnHtmlBalloonFinished = $.noop;
		};
		balloon = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), '');
		balloon.SetRectSize(150, 220);
		balloon.SetScreenLocation(60, 0);
		balloon.SetIsAddCloseButton(true);
		balloon.SetIsAddMargin(true);
		balloon.SetIsAddBackgroundImage(true);
		balloon.ShowHtml(htmlStr);
	}

	analysis.clear = clear; // 清除临时数据
	analysis.clearHtmlBallon = clearHtmlBallon;
	analysis.clearLinesight = clearLinesight;
	analysis.measure = measure; // 距离、面积测量
	analysis.measureSurfaceArea = measureSurfaceArea; // 地表面积测量
	analysis.measureSlope = measureSlope; // 坡度测量
	analysis.fixedObserver = fixedObserver; // 定点观察
	analysis.lineOfSight = lineOfSight; // 视线分析
	analysis.showHeightLine = showHeightLine; // 通视控高
	analysis.viewShed = viewShed; // 视域分析
	analysis.skyline = skyline; // 天际线
	analysis.shinning = shinning; // 日照
	analysis.getAltitude = getAltitude; // 获取高程
	analysis.excavationAndFill = excavationAndFill; // 挖填方
	analysis.vectorExcaveAndFill = _vectorExcaveAndFill; //导入矢量面挖填方
	analysis.submergePoint = submergePoint; //点源淹没
	analysis.submergeLine = submergeLine; //流域分析
	analysis.createSubmergePolygon = createSubmergePolygon; //创建淹没水面
	analysis.bestPath = bestPath; //地形路径
	analysis.shadow = shadow; //阴影分析
	analysis.simulation = simulation; //阴影动态模拟

	analysis.pointClear = pointClear; //清除临时点
	analysis.pointToline = pointToline; //点线距离
	analysis.pointToSegment = pointToSegment;
	analysis.pointToZline = pointToZline;
	analysis.lineToline = lineToline; //线线距离x
	analysis.SurfacesToSurfaces = SurfacesToSurfaces; //面面距离
	analysis.pointToSurfaces = pointToSurfaces; //点面距离
	analysis.lineToSurfaces = lineToSurfaces; //线面距离
	analysis.buidTobuid = buidTobuid; //建筑物间距离
	analysis.sun = sun; //建筑物间距离
	analysis.hideBollon = hideBollon;
	analysis.showMoveHtml = showMoveHtml;
	analysis.insolation = insolation;
	analysis.clipScene = clipScene;
	analysis.slope = slope;
	analysis.submergePolygons = submergePolygons;
	analysis.showSide = showSide;
	analysis.contour = contour; //等高线
	analysis.createHeatMap = createHeatMap; //热力图
	analysis.GetWindSceneLayersCount = GetWindSceneLayersCount;
	analysis.GetWindSceneLayers = GetWindSceneLayers;
	analysis.windScene = windScene; //风场分析
	analysis.difference = difference; //区域监测绘制
	analysis.section = section; //权值分段点击，分段权值
	analysis.colorPolygon = colorPolygon; //给多边形赋值颜色
	return analysis;
};