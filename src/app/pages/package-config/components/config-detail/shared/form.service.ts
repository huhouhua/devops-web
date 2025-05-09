import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResult } from 'src/app/shared/common.type';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { cloneDeep, uniq, uniqBy } from 'lodash-es';
import {
    ChildrenData,
  Compile,
  GenerateTemplateContext,
  GitLabProject,
  Packing,
  TemplateCharts,
  TemplateChartsControl,
  TemplateFile,
  TemplateFileControl,
  TemplateImage,
  TemplateImageControl,
} from './options';
import * as YAML from 'js-yaml';
import { NgEventBus } from 'ng-event-bus';
import { EventBus } from './event-bus';

@Injectable({
  providedIn: `root`,
})
export class FromService {
    
    constructor(private eventBus: NgEventBus){}
    public SetFromValue(gitLabProject:GitLabProject[], yamlData:string, validateForm: FormGroup){
           if(yamlData == ''){
              return;
           }
           
          let yamlAllData = JSON.parse(yamlData);
          let productYaml =YAML.load(yamlAllData.productYaml)as any;
          let packageYamls =YAML.load(yamlAllData.packageYaml) as any[];
          // console.log(productYaml);
          // console.log(packageYamls);
          this.setValueOfProduct(productYaml.product,validateForm);
          this.setValueOfCompile(productYaml.compile,gitLabProject);
          this.setValueOfPacking(productYaml.packing,packageYamls,validateForm);
    }

    private setValueOfProduct(productYaml:any, validateForm: FormGroup){
        const date = productYaml.date;
        let dateValue = `${date.substr(0,4)}-${date.substr(4,2)}-${date.substr(6,2)}`
        // validateForm.get('date')?.setValue('');
        validateForm.get('date')?.setValue(new Date(dateValue));
        validateForm.get('name')?.setValue(productYaml.name);
        validateForm.get('prefix')?.setValue(productYaml.prefix);
        validateForm.get('stage')?.setValue(productYaml.stage);
        validateForm.get('version')?.setValue(productYaml.version);
    }
    private setValueOfCompile(compile:any[],gitLabProject:GitLabProject[]){
      console.log(gitLabProject);
        compile.forEach(element => {
             let project = gitLabProject.find(q=>q.sshUrlRepo == element.git);
           this.eventBus.cast(EventBus.setCompileForm,{
             projectId:project == null? '':project.id,
             compile:element
           });
        });
    }
    private setValueOfPacking(packing:any[],packageYamls:any[],validateForm: FormGroup){
        packing.forEach((element:any,index:number) => {
          let template = packageYamls.find(q=>q.key == element.template);
          let yamlData = YAML.load(template.value) as any;
          console.log(yamlData);
          let templateCtx = new GenerateTemplateContext();
          yamlData.files.http.forEach((elementfile_http:any,index:number)=>{
            let control = new TemplateFileControl();
            control.controlValue.after = elementfile_http.after;
            control.controlValue.before = elementfile_http.before;
            control.controlValue.target = elementfile_http.target;
            control.controlValue.id = index;
             
            elementfile_http.files.forEach((elementfile:any,indexFile:number)=>{
               
                let children = new ChildrenData();
                children.id = indexFile;
                
                if(elementfile.name.search('-')>=0 && elementfile.name.startsWith('{{ index .')){
                    children.type = 1;
                    children.name = elementfile.name.split('.')[1].split(' ')[0];
                }else if(elementfile.name.endsWith(" }}") && elementfile.name.startsWith('{{ ')){
                    children.type = 1;
                    children.name = elementfile.name.split(' ')[1].substr(1)
                }else {
                    children.type = 0;
                    children.fillInName = elementfile.name;
                }
                control.controlValue.listOfChildrenData.push(children);
            })
            templateCtx.TemplateFiles.push(control);
          })

          yamlData.images.forEach((element:any,indexImage:number)=>{
            let control = new TemplateImageControl();
            control.controlValue.target = element.target;
            control.controlValue.id = indexImage;
            element.source.forEach((source:any,sourceIndex:number)=>{
                let children = new ChildrenData();
                children.id = sourceIndex;
                if(source.search('-')>=0 && source.startsWith('{{ index .')){
                      children.type = 1;
                    children.name = source.split('.')[1].split(' ')[0];
                }else if(source.endsWith(" }}") && source.startsWith('{{ ')){
                  children.type = 1;
                    children.name = source.split(' ')[1].substr(1)
                }else{
                  children.type = 0;
                  children.fillInName =source;
                }
                control.controlValue.listOfChildrenData.push(children);
            })
            templateCtx.TemplateImages.push(control);
          })

          yamlData.charts.forEach((element:any,indexChart:number)=>{
            let control = new TemplateChartsControl();
            control.controlValue.id = indexChart;
            control.controlValue.target = element.target;
            element.source.forEach((source:any,sourceIndex:number)=>{
                let children = new ChildrenData();
                children.id = sourceIndex;
                if(source.search('-')>=0 && source.startsWith('{{ index .')){
                  children.type = 1;
                    children.name = source.split('.')[1].split(' ')[0];
                }else if(source.endsWith(" }}") && source.startsWith('{{ ')){
                  children.type = 1;
                    children.name = source.split(' ')[1].substr(1)
                }else{
                  children.type = 0;
                  children.fillInName =source;
                }
                control.controlValue.listOfChildrenData.push(children);
            })
            templateCtx.TemplateCharts.push(control);
          })
          element.medaData =  templateCtx;
          element.id = index;
          this.eventBus.cast(EventBus.setPackingForm,element);
          this.setValueOfFileConfig(element,validateForm)
         });
    }

    private setValueOfFileConfig(pack:Packing,validateForm: FormGroup){
      pack.medaData.TemplateFiles.forEach((element,index)=>{
       validateForm.addControl(
        `${pack.id}_${index}_template_file_target`,
        new FormControl(element.controlValue.target, Validators.required)
      );
      validateForm.addControl(
        `${pack.id}_${index}_template_file_before`,
        new FormControl(element.controlValue.before)
      );
      validateForm.addControl(
        `${pack.id}_${index}_template_file_after`,
        new FormControl(element.controlValue.after)
      );
      })
      
      pack.medaData.TemplateImages.forEach((element,index)=>{
        validateForm.addControl(
          `${pack.id}_${index}_template_image_target`,
          new FormControl(element.controlValue.target, Validators.required)
        );
       })

       pack.medaData.TemplateCharts.forEach((element,index)=>{
        validateForm.addControl(
         `${pack.id}_${index}_template_charts_target`,
         new FormControl(element.controlValue.target, Validators.required)
       );
       })
    }
    public setRemoveOfFileConfig(pack:Packing,validateForm: FormGroup){
      pack.medaData.TemplateFiles.forEach((element,index)=>{
       validateForm.removeControl(`${pack.id}_${index}_template_file_target`);
       validateForm.removeControl(`${pack.id}_${index}_template_file_before`);
       validateForm.removeControl(`${pack.id}_${index}_template_file_after`);
      })
      
      pack.medaData.TemplateImages.forEach((element,index)=>{
        validateForm.removeControl(`${pack.id}_${index}_template_image_target`);
       })

       pack.medaData.TemplateCharts.forEach((element,index)=>{
        validateForm.removeControl(`${pack.id}_${index}_template_charts_target`);
       })
    }
}