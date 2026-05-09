import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MenuItem, MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  @Input() open = true;
  @Output() openChange = new EventEmitter<boolean>();

  menu: MenuItem[] = [];
  openedItems: Set<number> = new Set<number>();

  constructor(private menuService: MenuService) {
    console.log('SidebarComponent constructor called');
  }

  toggleSidebar(): void {
    this.open = !this.open;
    this.openChange.emit(this.open);
  }

  closeSidebar(): void {
    if (window.innerWidth <= 900) {
      this.open = false;
      this.openChange.emit(this.open);
    }
  }

  ngOnInit(): void {
    this.menu = this.menuService.getMenu();
    console.log('Sidebar menu loaded:', this.menu);
  }

  toggleItem(id: number): void {
    if (this.openedItems.has(id)) {
      this.openedItems.delete(id);
    } else {
      this.openedItems.add(id);
    }
  }

  isOpen(id: number): boolean {
    return this.openedItems.has(id);
  }
}