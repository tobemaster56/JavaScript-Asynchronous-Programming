// @ts-nocheck
import React, {useEffect, useRef} from 'react';
import logo from './logo.svg';
import './App.css';
// @ts-ignore
import asyncPool from "tiny-async-pool";
// @ts-ignore
import {syncSleep} from 'sleep-monster'

function App() {
  const timeout = (i: number) => new Promise(resolve => setTimeout(() => resolve(i), i));
  const test = async () => {
    const results = await asyncPool(2, [500, 2000, 600, 1000], timeout);
    console.log(results)
  }
  
  // alert, confirm, prompt  浏览器原生阻塞，用用户交互结束阻塞, 原生阻塞的特点，浏览器彻底不响应
  const onAlert = () => {
    alert("你被 alert 了，看看控制台的 console.log")
    console.log("你被 alert 了")
  }
  
  const onConfirm = () => {
    // eslint-disable-next-line no-restricted-globals
    const res = confirm('您需要确定一下')
    console.log(res)
  }
  
  const onPrompt = () => {
    const value = prompt("你叫啥")
    console.log(value)
  }
  
  
  // 用程序模拟阻塞线程，给定一个时间 ，阻塞的过程中，用户做了一些交互啥的，还是会响应的，只不过得等等
  // 结果非常有意思，正常情况下，短时间内基本不可能触发两次 alert。多年以前的一个 bug。弹窗弹了 2 次。正常，打开弹窗，会快速生成遮罩，阻止了再次点击
  // setTimeout 的执行时机？
  
  const onSleep = () => {
    setTimeout(() => {
      console.log('3000ms') // 异步任务也被阻塞
    }, 3000)
    
    // 尽量避免阻塞式的编程
    syncSleep(5000)
    
    console.log('5000ms later now.Both synchronous and asynchronous code are blocked.') // 所有的同步任务和异步任务都被阻塞了
  }
  
  const onSleepRandom = ()=>{
    const num  = Math.floor(Math.random() * 500);
    syncSleep(num)
  }
  
  const noResultPromise = new Promise((resolve, reject) => {
    // console.log(resolve, reject)
  })
  const onPromise = async () => {
    const res = await noResultPromise
    // 下面的代码永远不会执行了，因为是个 永远 pending 的承诺
    console.log(res)
  }
  
  let count = 0
  const onPromiseLoop = () => {
    function demo() {
      count++
      Promise.resolve(performance.now()).then(res => {
        if (count > 100000) return
        console.log(res)
        demo()
      })
    }
    
    demo()
  }
  
  const divRef = useRef<HTMLElement | undefined>()
  const onDivSetTimeout = () => {
    let oDiv = divRef.current!
    const cb = () => {
      const left = oDiv.offsetLeft
      oDiv.style.left = left + 5 + "px";
      setTimeout(cb, 1000 / 60);
    }
    setTimeout(cb, 0)
  }
  
  const onRaf = ()=>{
    // raf队列全部执行完
    function cb(time) {
      console.log('rafCb: ' + time)
      syncSleep(200)
      Promise.resolve().then(()=>{
        console.log('raf里的 promise')
      })
    }
    requestAnimationFrame(cb)
    requestAnimationFrame(cb)
  }
  const onDivRAF = () => {
    let oDiv = divRef.current!
    const cb = () => {
      const left = oDiv.offsetLeft
      oDiv.style.left = left + 5 + "px";
      requestAnimationFrame(cb);
    }
    requestAnimationFrame(cb)
  }
  
  const onSetTimeout = ()=>{
    // 扫描到期任务的时候，应该会按照预期的到期时间的先后去执行任务。
    // startTime + delayTime = expectedExecuteTime
    
    setTimeout(()=>{
      console.log('delay 200ms')
      Promise.resolve().then(()=>{
        console.log("promise 200ms")
      })
    }, 200)
  
  
    syncSleep(200)
  
    setTimeout(()=>{
      console.log('delay 100ms')
      Promise.resolve().then(()=>{
        console.log("promise 100ms")
      })
    }, 100)
  }
  
  const onPromises = () =>{
    const p1 = new Promise(resolve => {
      console.log('begin');
      resolve('then1');
    }).then(v => {
      console.log(v);
      return 'then2';
    }).then(v => {
      console.log(v);
      return 'then3';
    })
  
    // then 链式调用，和微任务的产生关系
    new Promise(resolve => {
      console.log(1);
      resolve();
    })
      .then(() => {
        console.log(2);
      })
      .then(() => {
        console.log(3);
      })
      .then(() => {
        console.log(4);
      })
      .then(() => {
        console.log(5);
      })
  
    const p2 = new Promise(resolve => {
      // p1 resolve，并不能立刻让 p2 状态变更
      resolve(p1);
    })
  
    p2.then(v => console.log(v));
    
    // begin
    // App.tsx:132 1
    // App.tsx:126 then1
    // App.tsx:136 2
    // App.tsx:139 3
    // App.tsx:142 4
    // App.tsx:153 then2
    // App.tsx:145 5
  }
  
  useEffect(() => {
    const oBtn = document.getElementById("btn");
    (window as any).oBtn = oBtn;
    // 浏览器响应交互的时候，都是封装成 异步的。绑定了 2 次函数。其实是 2 个 task。
    // 如果是用户手动调用的话，就是同步的。
    // oBtn.dispatchEvent(evt:Event)
    // oBtn.click()
    // 一个是用户交互，一个是程序控制。
    // setTimeout, 放到另外一个task 中去，脱离当前同步的调用栈。思考这个参数的意义，但是这个参数又是不精确的。
    
    oBtn?.addEventListener('click', () => {
      console.log('btn clicked');
      Promise.resolve(performance.now()).then(res => {
        console.log(res)
      })
    });
    oBtn?.addEventListener('click', () => {
      console.log('btn clicked');
      Promise.resolve(performance.now()).then(res => {
        console.log(res)
      })
    });
  }, [])
  
  // @ts-ignore
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={test}>test</button>
        <button onClick={onAlert}>alert</button>
        <button onClick={onConfirm}>confirm</button>
        <button onClick={onPrompt}>prompt</button>
        <button onClick={onSleep}>sleep</button>
        <button onClick={onSleepRandom}>sleep Random</button>
        
        <button id="btn">原生事件</button>
        <button onClick={onPromise}>等待 promise 永远</button>
        <button onClick={onPromiseLoop}>promise Loop</button>
        <button onClick={onDivRAF}>动画帧</button>
        <button onClick={onSetTimeout}>看看延迟跟顺序有关吗</button>
        <button onClick={onPromises}>一系列的 promise</button>
        <button onClick={onRaf}>raf队列</button>
        
        <div style={{position: "absolute", left: 0, width: 100, height: 100, background: "red"}} ref={divRef}
             onClick={onDivSetTimeout}/>
      </header>
    </div>
  );
}

export default App;
