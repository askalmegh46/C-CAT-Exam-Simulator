'use client';
import {useEffect} from 'react';
export default function ActivityHeartbeat(){useEffect(()=>{fetch('/api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'login'})}).catch(()=>{});},[]);return null;}
