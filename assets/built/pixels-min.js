$(function(){const n={name:"letter",el:".js-card-url"},e={load:"load"};let t={};const o=new URL(location.href),i=o.searchParams.get("s")||"direct",c=o.pathname.replace(/\/(.+)\//,"$1");let a=window.scrollY,l=(window.innerHeight,$("article").height(),!1);const r=$(".kg-image");function s(){let n=[].slice.call(arguments);const e=n.pop(),o=n.join("_"),i="https://improving.duckduckgo.com/t/blog_"+o;if(!(e&&e.once&&t[o]))if(e&&e.once&&(t[o]=!0),"sendBeacon"in navigator)navigator.sendBeacon(i);else{$("<img>").attr("src",i)}}function d(){r.each(function(n){(function(n,e){e=e||!1;const t=n.getBoundingClientRect(),o=t.top,i=t.left,c=t.bottom,a=t.right,l=window.innerHeight,r=window.innerWidth;return e?(o>0&&o<l||c>0&&c<l)&&(i>0&&i<r||a>0&&a<r):o>=0&&i>=0&&c<=l&&a<=r})(this,!0)&&s("image",i,c,n+"of"+r.length,{once:!0})}),l=!1}s(e.load,i,c,{once:!0}),window.addEventListener("scroll",function(){a=window.scrollY,l||requestAnimationFrame(d),l=!0},{passive:!0}),d(),$(".js-newsletter").one("submit",function(e){s(n.name,i,c,{once:!0})}),$("article a").click(function(){const n=this.href.replace(/^\/|\/$/,"").replace(/[^a-z0-9_-]+/gi,"-").replace(/_/g,"-");s("link",i,c,n,{once:!1})})});