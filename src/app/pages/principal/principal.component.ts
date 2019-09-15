import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { PacienteService } from './../../services/paciente.service';
import { Paciente } from '../../models/paciente.model';
import { timer } from 'rxjs';
import swal from 'sweetalert2';
import { AuthenticationService } from './../../services/authentication.service';
import { UserService } from './../../services/user.service';
import { User } from './../../models/user.model';
import { AgendaService } from '../../services/agenda.service';
import { formatDate } from '@angular/common';
import { IcuPlaceholder } from '@angular/compiler/src/i18n/i18n_ast';
import { ElectronService } from 'ngx-electron';
declare const require: any;
const jsPDF = require('jspdf');
declare var electron: any;
declare var ipc: any;
@Component({
  selector: 'app-principal',
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.css']
})
export class PrincipalComponent implements OnInit {
  @ViewChild('myDiv') myDiv: ElementRef;
 documento:string = '';
 loading:boolean;
 existe:boolean;
 elementos:Paciente[] = null;
 elementoPaciente:Paciente = null;
 elementoTurno:any = null;
 elemento:User = null;
 elementoModulo:[] = null;
 user:User;
 username:string;
 loggedIn:boolean = false;
 imprimir:boolean = false;
 horario:any;
 estado:string = 'CONECTANDO CON EL SERVIDOR';
 motivo_turno:string;
//ipc = require ('electron').ipcRenderer;
  constructor(private pacienteService:PacienteService,private agendaService:AgendaService, private authenticationService: AuthenticationService, private miServico:UserService,private _electronService: ElectronService ) {
    
    
   }

  ngOnInit() {
    
    
   
  //  this.authenticationService.logout();
  //this.playPingPong();
  let currentUser = JSON.parse(localStorage.getItem('currentUser'));
  console.log(currentUser);
  if(currentUser){
    let userData = JSON.parse(localStorage.getItem('userData'));
    console.log(userData);
    console.log('usuario logueado');
    this.loggedIn = true;
       this.username = userData['username'];
       console.log(userData['access_list']);
       this.asignarModulos(userData['access_list']);
       //this.menuList();
  }else{
    this.onSubmit();
  }
  this.onSubmit();

  }



  agregarCaracter(numero:string){
    this.documento = this.documento+numero;
  }

  borrarCaracter(){
    this.documento= this.documento.substring(0, this.documento.length - 1);
  }

  onSubmit() {
   
   
  
    // stop here if form is invalid

  
    this.loading = true;
    this.estado = 'AUTENTICANDO APLICACION';
    this.authenticationService.login('clinica','clinica1234')
       // .pipe(first())
        .subscribe(
            data => {
              this.user = data;
              let us = new User("","","","","",'admin','admin',[]);
              localStorage.setItem('userData', JSON.stringify(us));
              localStorage.setItem('currentUser', JSON.stringify(this.user));
              //  this.router.navigate([this.returnUrl]);
              this.loadUser();
            },
            error => {
           
              console.log(error);
               // this.error = error;
                this.loading = false;
            });
  }

loadUser(){

  this.loading = true;
  try {
    this.miServico.getItemInfoAndMenu('clinica')
      .subscribe(resp => {
      this.elemento = resp;
     
         let currentUser =  JSON.parse(localStorage.getItem('currentUser'));
         let userData = JSON.parse(localStorage.getItem('userData'));
         console.log(this.elemento);
         this.elementoModulo = <any>this.elemento;
        this.user = new User(this.elemento[0]['id'] , this.elemento[0]['email'], this.elemento[0]['nombreyapellido'],
         this.elemento[0]['name'],'1',this.elemento[0]['email'], currentUser['access_token'],this.elementoModulo);
         this.username = userData['username'];
         localStorage.removeItem('userData');
         localStorage.setItem('userData', JSON.stringify(this.user));
         this.asignarModulos(this.elementoModulo);       
          this.loading = false;
          console.log('logueado');
          this.loggedIn = true;
        
      },
      error => { // error path
          console.log(error.message);
          console.log(error.status);
          localStorage.removeItem('error');
          localStorage.setItem('error', JSON.stringify(error));
           
      //    this.throwAlert('error','Error: '+error.status+'  Error al cargar los registros',error.message);
       });    
  } catch (error) {
  //  this.throwAlert('error','Error al cargar los registros',error);
  }  
  }
  

  asignarModulos(modulos: any){
    modulos.forEach(element => {
     // console.log(element['modulo_nombre']);
    
    });
  
  }
  
  //VALIDO SI EL PACIENTE EXISTE
  buscarPaciente(){
  
  
    if(this.documento.length>0){
      this.existe= false;
    this.loading = true;
    this.estado = 'BUSCANDO PACIENTE';
    try {
        this.pacienteService.getPacienteDni(this.documento)
        .subscribe(resp => {
          if(resp.length>0){
            // SI EL PACIENTE EXISTE PROCEDO A BUSCAR EL TURNO DEL DIA
        this.elementoPaciente = resp[0];
            this.loading = false;
            this.estado = '';

            console.log(resp);
            console.log('paciente existente');
          /*  const Toast = swal({
              toast: false,
              imageUrl: './assets/user.png',
              imageHeight: 200,
              imageWidth: 200,
              title: 'Buscando paciente',
              showConfirmButton: false,
              timer: 2000,
              backdrop: `
              rgba(26, 188, 156,0.7)
              no-repeat
            `
            });*/
            this.turnoRecepcionPacienteExistente();
            this.existe = false;

          } else {
            console.log('paciente inexistente');
           /* const Toast = swal({
              toast: false,
              imageUrl: './assets/user.png',
              imageHeight: 200,
              imageWidth: 200,
              title: 'Creando paciente',
              showConfirmButton: false,
              timer: 2000,
              backdrop: `
              rgba(26, 188, 156,0.7)
              no-repeat
            `
            });*/
            this.existe = true;
            this.loading = false;
            this.elementoPaciente = new Paciente('',this.documento, '','','','',new Date(),'','','','','','','','','','','','','','','','','','','');
            this.turnoRecepcionPacienteNuevo();
          }
        },
        error => { // error path
            console.log(error.message);
            console.log(error.status);
            this.estado = 'HUBO UN PROBLEMA ...  estado: '+error.status+' error : '+error.message;
         });
    } catch (error) {
      this.estado = 'HUBO UN PROBLEMA ...  estado: '+error.status+' error : '+error.message;
    }  
  }
}



turnoRecepcionPacienteNuevo(){
  this.existe= false;
  this.loading = true;
  this.estado = 'CREANDO TURNO PARA EL PACIENTE';
  let _fechaEmision = formatDate(new Date(), 'dd/MM/yyyy', 'en');
  try {
      this.agendaService.turnoRecepcionPacienteNuevo(this.elementoPaciente)
      .subscribe(resp => {
        if(resp.length>0){
          let es_observacion:string = resp[0]['es_observacion'];
          let usuario_id:number = resp[0]['usuario_id'];
          let apellido:string = resp[0]['apellido'];
          let nombre:string = resp[0]['nombre'];

          if((nombre === '-')){
            resp[0]['nombre'] ='';
          }

          if((apellido === '-')){
            resp[0]['apellido'] ='';
          }

          if((es_observacion === '-')||(es_observacion === '')){
            resp[0]['es_observacion'] ='TURNO';
          }

          if((usuario_id === 23)){
            resp[0]['nombreyapellido'] ='';
          }else{
            resp[0]['nombreyapellido'] ='Turno con : '+ resp[0]['nombreyapellido']; 
          }
          this.loading = false;
          
          this.elementoTurno = resp[0];   
          this.generarPdf();
        }else{
          this.existe= true;
          this.loading = false;
          this.estado = '';
        }
      },
      error => { // error path
          console.log(error.message);
          console.log(error.status);
       //   this.throwAlert('error','Error: '+error.status+'  Error al cargar los registros',error.message, error.status);
       });    
  } catch (error) {
  //this.throwAlert('error','Error al cargar los registros',error,error.status);
  }  
}
 

turnoRecepcionPacienteExistente(){
  this.existe= false;
  this.loading = true;
  let _fechaEmision = formatDate(new Date(), 'dd/MM/yyyy', 'en');
  try {
      this.agendaService.turnoRecepcionPacienteExistente(this.elementoPaciente)
      .subscribe(resp => {
        if(resp.length>0){

                     
          // VALIDO LOS DATOS QUE VUELVEN Y LOS CAMBIO SEGUN SEA REQUERIDO    
          let es_observacion:string = resp[0]['es_observacion'];
          let usuario_id:number = resp[0]['usuario_id'];

          if((es_observacion === '-')||(es_observacion === '')){
            resp[0]['es_observacion'] ='TURNO';
          }

          if((usuario_id === 23)){
            resp[0]['nombreyapellido'] ='';
          }else{
            resp[0]['nombreyapellido'] ='Turno con : '+ resp[0]['nombreyapellido']; 
          }
          this.loading = false;
          
          this.elementoTurno = resp[0];   
          console.log(this.elementoTurno);
          this.existe= false;
          this.generarPdf();
          
        }else{
          this.existe= true;
          this.loading = false;
        }
      },
      error => { // error path
          console.log(error.message);
          console.log(error.status);
      //    this.throwAlert('error','Error: '+error.status+'  Error al cargar los registros',error.message, error.status);
       });    
  } catch (error) {
 // this.throwAlert('error','Error al cargar los registros',error,error.status);
  }  
}






generarPdf(){
  this.imprimir = true;
  console.log(this.myDiv.nativeElement.innerHTML);
  this.horario = formatDate(new Date(), 'dd/MM/yyyy hh:mm', 'en');
  
   /*  swal({
    
      
      text:'PACIENTE : '+ this.elementoPaciente['apellido']+' '+this.elementoPaciente['nombre'],
      
      imageUrl: './assets/printer-icon.png',
      imageHeight: 200,
      imageWidth: 200,
      title: 'IPRIMIENDO',
      showConfirmButton: false,
      timer: 2000,
      backdrop: `
      rgba(26, 188, 156,0.7)
      no-repeat
    `
    
    });*/
  ipc.send('print-to-pdf',  this.myDiv.nativeElement.innerHTML);

  ipc.on('wrote-pdf', function(event, path){
    swal({  
      text:'PACIENTE : '+ this.elementoPaciente['apellido']+' '+this.elementoPaciente['nombre'],
      
      imageUrl: './assets/printer-icon.png',
      imageHeight: 200,
      imageWidth: 200,
      title: 'IPRIMIENDO',
      showConfirmButton: false,
      timer: 2000,
      backdrop: `
      rgba(26, 188, 156,0.7)
      no-repeat
    `
    
    });
    console.log('respueta recibida '+ path);

  });

  setTimeout(() => 
{
 
    this.imprimir =  false;
    this.elementoPaciente = null;
},
3000);

}
}

