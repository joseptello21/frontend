import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { RolesComponent } from './roles';
import { RolService } from '../../core/services/rol.service';
import { RecursoService } from '../../core/services/recurso.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { UsuarioRolService } from '../../core/services/usuario-rol.service';
import { RolRecursoService } from '../../core/services/rol-recurso.service';

describe('RolesComponent', () => {
  let component: RolesComponent;
  let fixture: ComponentFixture<RolesComponent>;

  const rolServiceStub = {
    listar: () => of([]),
    crear: (rol: any) => of({ ...rol, id: 1 })
  };

  const recursoServiceStub = {
    listar: () => of([])
  };

  const usuarioServiceStub = {
    listar: () => of([])
  };

  const usuarioRolServiceStub = {
    listar: () => of([])
  };

  const rolRecursoServiceStub = {
    listar: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesComponent],
      providers: [
        { provide: RolService, useValue: rolServiceStub },
        { provide: RecursoService, useValue: recursoServiceStub },
        { provide: UsuarioService, useValue: usuarioServiceStub },
        { provide: UsuarioRolService, useValue: usuarioRolServiceStub },
        { provide: RolRecursoService, useValue: rolRecursoServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RolesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
