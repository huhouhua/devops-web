import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.less']
})
export class LayoutComponent  implements OnInit{
  ngOnInit(): void {
      
  }
  isCollapsed = false;
}
