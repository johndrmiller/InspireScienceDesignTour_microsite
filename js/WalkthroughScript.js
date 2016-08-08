$(document).ready(function(){
    //GLOBAL VARIABLES
    var body = $("body"),
    navbuttons = $(".navButton"),
    navbuttonArr = jQuery.makeArray(navbuttons),//Later I want to tie the button pushed to the corresponding slide that it activates, but you can't get indexOf a jquery object. There is, however, a method to make a jQuery object into an array!
    arrows = $(".arrows"),
    slides = $(".slides"),
    timeBar = $(".timeBar"),
    currentPercent = $(".currentPercent"),
    currentStop = CurrentStop(),
    requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame,
    cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelANimationFrame,
    videoPlaying = 0, //whether or not video is playing 0 = No, 1 = Yes
    textElementVisible = 1, //determines whether a text element is visible 0 = No, 1 = Yes
    VCR = videoControlRouter,
    arrowTimeout,
    arrowPing,
    req;
    //testForIOS = window.matchMedia("only screen and (min-device-width : 768px) and (max-device-width : 1024px)");
    
    $("audio")[0].volume = 0.125;

    //LISTENERS
    navbuttons.on("click", changeSlide);
    arrows.on("click",sceneUpdate);
    $(".closeButton").on("click", function(){window.close();});
    $(".otherSectionButton").on("click",function(e){
    	if (e.target === $(".otherSectionButton")[0]){
    		$(navbuttonArr[2]).trigger("click");
    	} else if (e.target === $(".otherSectionButton")[1]) {
    		$(navbuttonArr[1]).trigger("click");
    	}
    });

    textUpdater();
    arrowTimer(1500);

    //FUNCTIONS
	function CurrentStop(){
        var slide =  $(".onScreen"),
        texts = $(slide.children(".slideText")),
        media = $(slideElement(slide)),
        oldStop,
        newStop=0;
        return {        
            getSlide : function() {return slide;},
            getStops : function (n) {var thingo={0:oldStop, 1:newStop}; return thingo[n]; },
            getNewStop : function () {return newStop;},
            getTexts : function () {return texts},
            getMedia : function () {return media},
            setSlide : function (sl) {
                slide = sl;
                texts = $(slide.children(".slideText"));
                media = $(slideElement(slide));
            },
            setStop : function(st){ oldStop=newStop; newStop = st;}
        };
	}

    function changeSlide(e){ 
        //DEFINITIONS
        var currentButton = $(".currentBtn"),
        newBtn = $(this),//the button that was clicked
        win = window.innerWidth,
        newSlide = $(newBtn[0].dataset.slide),//correlate index of button to index of slide to be shown
        nSlideEleJS = slideElement(newSlide),
        nSlideEle = $(nSlideEleJS),
        currentSlide = currentStop.getSlide(),//getting current slide by class
        slideEleJS = slideElement(currentSlide),//media as just js node (not jQuery)
        slideEle = $(slideEleJS);//getting media within slide div as jquery object

        //LISTENERS
        navbuttons.off("click",changeSlide);//turn off listener to prevent breakage
        
        //MAIN BODY
        if (req) {
            videoPlaying = 0;
        }
        if (newSlide[0] === currentSlide[0]) {
            if (slideEle.is("video")) {
            	currentStop.setStop(0);
            	slideEleJS.currentTime=0;
            	slideEleJS.play();
                videoPlaying = 1;
                req = requestAnimationFrame(VCR);
            }
            navbuttons.on("click", changeSlide);//if the button for the current slide is clicked on, do nothing but turn the button listener back on
        } else {
	        if ($(".deactivateArrow").length == 1) {
        		$(".deactivateArrow").removeClass("deactivateArrow");
        	}
	        if (newSlide[0] == slides[0]) {
	        	arrows.first().addClass("deactivateArrow");
	        } else if (newSlide[0] == slides[slides.length-1]) {
	        	if (newSlide.is("img")) {
                   arrows.last().addClass("deactivateArrow"); 
                }  
	        }
	        
            $(".textShowing").removeClass("textShowing");
            
            if (slideEle.is("video")) {
                slideEleJS.pause();
            	if (slideEleJS.currentTime && slideEleJS.currentTime!==0) {
            		slideEleJS.currentTime = 0;
            		updateTimeBar(currentStop.getSlide());
            	}
                videoPlaying=0;
            }

            if ((body.width() > 800) || (body.height() > 550)) {
                body.css("overflow-x", "hidden");
            }

            newBtn.addClass("currentBtn");
            currentButton.removeClass("currentBtn");                    
            newSlide.addClass("onScreen");
            
            if (nSlideEle.is("img") && !timeBar.hasClass("hideTimeBar")) {
                timeBar.addClass("hideTimeBar");
            }

            newSlide.css({top:0, left:win});
            newSlide.animate({left:0+"px"},1000);
            
            currentSlide.animate({left:-win+"px"},1000,function(){
                currentSlide.removeClass("onScreen");
                currentSlide = newSlide;
                currentStop.setSlide(currentSlide);
                currentStop.setStop(0);

                slideEle = $(currentSlide.children()[0]);
                slideEleJS = slideEle[0];

                newSlide = nSlideEle = nSlideEleJS = undefined;
                textUpdater();

                if (body.css("overflow-x")=="hidden") {
                    body.css("overflow-x", "visible");
                }
                
                if (slideEle.is("video")){
                    if(timeBar.hasClass("hideTimeBar")){
                        timeBar.removeClass("hideTimeBar");
                    }
                }
                arrowTimer(1500);
                navbuttons.on("click", changeSlide);
            });            
        }
    }
    
    function sceneUpdate(e) {
        var dir = this.id.slice(0,1),//determine update direction (backward or forward)
        currentSlide = currentStop.getSlide(),//get current slide
        slideEleJS = slideElement(currentSlide),
        slideEle = $(slideEleJS),
        slideID = currentSlide[0].id,
        slideIndex = jQuery.makeArray($(".slides")).indexOf(currentSlide[0]),
        rarrow = $("#rarrow"),
        vidTime,
        thisStops,
        thisStopsLen;
        
        stopArrowTimer();

        if (rarrow.queue()[0] === "inprogress") {
            rarrow.stop(true);
            rarrow.removeAttr("style");
        }

        arrows.off("click",sceneUpdate);
        //if current slide has video, advance video to next (or previous) section
        if (slideEle.is("img")) {
            $(navbuttonArr[nextButton(slideIndex,dir)]).trigger("click");//sends the slide index and direction to nextButton function that computes the index of the next button within navbuttonArr
            arrows.on("click",sceneUpdate);
            return;
        } else if (slideEle.is("video")) {
            thisStops = slideStops[slideID];
            thisStopsLen = thisStops.length;
            videoPlaying = 0;
            vidTime = slideEleJS.currentTime;
            // console.log(vidTime, slideEleJS.duration);

            //console.log(thisStops[currentStop.getStops(1)], vidTime, dir);
            if (slideEleJS.paused===true && dir==="r"&& vidTime!=slideEleJS.duration) {
            //if vid is paused and right arrow was clicked and the video is not at the end    
                //console.log("part1");
                slideEleJS.play();
                currentStop.setStop(currentStop.getStops(1)+1);
             
             } else if ((vidTime <=5 && dir==="l") || (vidTime === slideEleJS.duration && dir==="r")) {
            //if video time is les than five and left button clicked or video is at end and right button clicked    
                var nextSlide = navbuttonArr[nextButton(slideIndex,dir)];
                if (nextSlide == undefined) {
                    textUpdater();
                    arrows.on("click",sceneUpdate);
                } else {
                    $(nextSlide).trigger("click");
                    arrows.on("click",sceneUpdate);
                }
                return;
            
            } else if (currentStop.getStops(1) == thisStopsLen && vidTime > thisStops[thisStopsLen-1].stop+5 && dir === "l") {

            	//console.log("part2.5");
            	slideEleJS.currentTime = thisStops[thisStopsLen-1].stop;
            
            } else if (currentStop.getStops(1) == thisStopsLen && vidTime < thisStops[thisStopsLen-1].stop+5 && dir === "l") {

            	//console.log("part2.7");
            	slideEleJS.currentTime = thisStops[thisStopsLen-2].stop;
            	currentStop.setStop(thisStopsLen-2);
            	
			} else if (thisStops[currentStop.getStops(1)] && vidTime < thisStops[currentStop.getStops(1)].stop && dir==="r") {
			                
                //console.log("part7");
                slideEleJS.currentTime = thisStops[currentStop.getStops(1)].stop;
                currentStop.setStop(currentStop.getStops(1)+1);

            } else if (((vidTime > thisStops[currentStop.getStops(1)-1].stop+5 && vidTime < thisStops[currentStop.getStops(1)].stop) || slideEleJS.paused===true)  && dir==="l") {
               
               //console.log("part3");
               slideEleJS.currentTime = thisStops[currentStop.getStops(1)-1].stop;
               slideEleJS.play();

            } else if ( vidTime < thisStops[currentStop.getStops(1)-1].stop+5 && vidTime > thisStops[currentStop.getStops(1)-1].stop &&dir==="l") {

                //console.log("part4");
                currentStop.setStop(currentStop.getStops(1)-1);
                slideEleJS.currentTime = thisStops[currentStop.getStops(1)-1].stop;
            
            } else if (vidTime == slideEleJS.duration && dir == "l") {

                //console.log("part5");
                slideEleJS.currentTime = thisStops[thisStopsLen-1].stop;
                currentStop.setStop(thisStopsLen);

            } else if (vidTime > thisStops[thisStopsLen-1].stop && dir==="r") {
                
                // console.log("part6");
                slideEleJS.currentTime = slideEleJS.duration;
                arrows.last().addClass("deactivateArrow");
                textUpdater();
                currentStop.setStop(thisStopsLen);
               

            } else if (vidTime < thisStops[currentStop.getStops(1)].stop && dir==="r") {
                
                //console.log("part7");
                slideEleJS.currentTime = thisStops[currentStop.getStops(1)].stop;
                currentStop.setStop(currentStop.getStops(1)+1);

            }
            
            arrowTimeout = window.setTimeout(function(){
                arrows.on("click",sceneUpdate);
                videoPlaying = 1;
                req = requestAnimationFrame(VCR);
                window.clearTimeout(arrowTimeout); 
            },50);
        }
        
        function nextButton(num,d) {
            if (d==="l"){
                return num-1;
            } else if (d==="r"){
                return num+1;
            }
        }
    }
    function updateTimeBar(e) {
        var slideEle = slideElement(e),
        percent = (slideEle.currentTime/slideEle.duration)*100,
        slideId = e.attr("id"),
        slideStoppers = slideStops[slideId];
        currentPercent.css("width", percent+"%");
        if (slideEle.currentTime === slideEle.duration){
            videoPlaying = 0;//if video stops playing A = 0
        } else if (slideStoppers[currentStop.getStops(1)]===undefined){
            return;
        } else if (slideStoppers[currentStop.getStops(1)].stop-0.05 <= parseFloat(slideEle.currentTime) && parseFloat(slideEle.currentTime) <= slideStoppers[currentStop.getStops(1)].stop+0.05) {
            //if slide video time is within 0.1s of current stop time pause video
            slideEle.pause();
            arrowTimer(1500);
            videoPlaying = 0;
        }        
    }
    
    function textUpdater (message) {
        //if (message) {console.log(message);}
        var texts = currentStop.getTexts(),//texts of slide
        currentTime = currentStop.getMedia()[0].currentTime || 0,//current time of media element
        visible = texts.filter(".textShowing"),//finds element that has class ".textShowing", if none returns empty array
        hasVisible = visible.length === 1,//checks for element in "visible"
        isVisible = hasVisible && parseInt(visible.css("opacity")) > 0, //checks to see if text element has opacity greater than 0
        newText;
        if (textElementVisible === 0) {
            return
        }
        
        if (isVisible && !(parseFloat(visible[0].dataset.start)<=currentTime && currentTime <= parseFloat(visible[0].dataset.end))) {
            //if element's start time is not less than the current time and currentTime is not less than the end time
            textElementVisible = 0;
            visible.animate({opacity:0},250, function(){
                $(this).removeClass("textShowing");
                textElementVisible = 1;
                textUpdater("thingo");//return;
            });  
        }

        if (!isVisible) {
           textElementVisible = 0;
            newText = texts.filter(function(index){
                return parseFloat(this.dataset.start) <= currentTime && currentTime <= parseFloat(this.dataset.end);
                // find object where current time is between start and end time
            });
            if (newText.length === 0) {
                textElementVisible=1;
                return;
            } else {
                newText.addClass("textShowing").animate({opacity:1},750, function(){textElementVisible=1; textUpdater("thingy");});
            }
        }
    }

    function slideElement(slide){
        return (slide.children("img").length===1) ? slide.children("img")[0] : slide.children("video")[0];
    }

    function arrowBounce(){
        $("#rarrow").animate({right:"-=15"},600, function(){
            $("#rarrow").animate({right:"+=15"},600, function() {
                $("#rarrow").animate({right:"-=15"},500, function() {
                    $("#rarrow").animate({right:"+=15"},500, function() {
                        $("#rarrow").animate({right:"-=5"},400, function() {
                            $("#rarrow").animate({right:"+=5"},400, function() {
                                arrowTimer();
                            });
                        });
                    });
                });
            });
        });
    }

    function arrowTimer(n){
        var time = n || 5000
        arrowPing = window.setTimeout(arrowBounce, time);
    }

    function stopArrowTimer() {
        clearTimeout(arrowPing);
    }

    function videoControlRouter(args){
        var slide = currentStop.getSlide();
        updateTimeBar(slide);
        textUpdater();
        if (videoPlaying === 0) {
            return;
        } else {
            req = requestAnimationFrame(VCR);
        }        
    }
});
